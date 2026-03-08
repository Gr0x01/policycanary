#!/usr/bin/env npx tsx
/**
 * Backfill: classify existing products into product categories.
 * Usage: npx tsx scripts/run-classify.ts [--user <userId>] [--force]
 *
 * --user   Only classify products for a specific user (default: all users)
 * --force  Reclassify products that already have a category
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import pLimit from "p-limit";

// Load .env.local before anything else
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// Inline Supabase client (bypasses server-only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const google = createGoogleGenerativeAI();

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const userIdx = args.indexOf("--user");
const userId = userIdx >= 0 ? args[userIdx + 1] : null;
const force = args.includes("--force");

// ---------------------------------------------------------------------------
// Category slugs (mirrored to avoid server-only import)
// ---------------------------------------------------------------------------

const PRODUCT_CATEGORY_SLUGS = [
  "baby_products","bath_preparations","eye_makeup","fragrance","hair_coloring",
  "hair_preparations_non_coloring","lipstick","makeup_not_eye","manicuring",
  "oral_hygiene","personal_cleanliness","shaving_preparations","skin_care",
  "suntan_preparations","tattoo","other_cosmetic","professional_salon",
  "baked_goods","nonalcoholic_beverages","breakfast_cereals","chewing_gum",
  "coffee_tea","condiments_relishes","confections_frostings","dairy_products",
  "egg_products","fats_oils","fish_products","fresh_fruits_vegetables",
  "frozen_dairy","fruit_vegetable_juices","gelatins_puddings",
  "grain_products_pastas","gravies_sauces","hard_candy_cough_drops",
  "herbs_spices_seasonings","instant_coffee_tea","jams_jellies","meat_products",
  "milk_products","imitation_dairy","nut_products","plant_protein_products",
  "poultry_products","processed_fruits_vegetables","reconstituted_vegetables",
  "snack_foods","soft_candy","soups_soup_mixes","sugar_substitutes",
  "sugars_syrups","sweet_sauces_toppings","alcoholic_beverages","bottled_water",
  "baby_food","food_contact_materials","food_preservatives","infant_formula",
  "medical_foods","pet_food","animal_feed","dietary_conventional_foods","other_food",
  "amino_acids_peptides","botanicals_herbal","enzymes","essential_fatty_acids",
  "fiber_supplements","mineral_supplements","multivitamins","mushroom_supplements",
  "probiotics_prebiotics","protein_powders","single_vitamins",
  "specialty_supplements","sports_performance","weight_management",
  "joint_bone_health","digestive_health","immune_support","beauty_supplements",
  "other_supplement",
  "prescription_drugs","otc_drugs","compounded_drugs","generic_drugs",
  "biosimilars","controlled_substances","ophthalmic_drugs","injectable_drugs",
  "topical_drugs_pharma","pediatric_drugs",
  "class_i_devices","class_ii_devices","class_iii_devices","in_vitro_diagnostics",
  "combination_products","digital_health_devices","implantable_devices",
  "radiation_emitting_devices",
  "vaccines","blood_products","cell_gene_therapy","tissue_products","allergenics",
  "xenotransplantation","human_cells_tissues",
  "cigarettes_combustible","vape_e_cigarettes","smokeless_tobacco",
  "nicotine_products","cigars","pipe_tobacco","hookah_waterpipe",
  "veterinary_drugs","animal_devices","animal_biologics","medicated_animal_feed",
  "veterinary_medical_devices",
] as const;

// ---------------------------------------------------------------------------
// Schema & prompt
// ---------------------------------------------------------------------------

const ClassificationSchema = z.object({
  category_slug: z
    .string()
    .describe("The single best-matching product category slug from the provided list."),
});

const SYSTEM_PROMPT = `You are an FDA product classifier. Given a product's name, brand, type, and ingredients, select the single most specific product category from the controlled vocabulary list.

Rules:
- Pick exactly ONE category slug from the list provided.
- Choose the most specific match — e.g. "protein_powders" over "other_supplement" for a whey protein product.
- Use the product_type as a guide for which group of slugs to focus on, but cross-category is allowed if the product clearly fits better elsewhere.
- If nothing fits well, use the "other_" category for that product type (e.g. "other_food", "other_supplement", "other_cosmetic").`;

function buildPrompt(product: {
  name: string;
  brand: string | null;
  product_type: string;
  ingredients: string[];
}): string {
  const parts = [
    `Product Name: ${product.name}`,
    product.brand ? `Brand: ${product.brand}` : null,
    `Product Type: ${product.product_type}`,
    product.ingredients.length > 0
      ? `Ingredients: ${product.ingredients.join(", ")}`
      : null,
    "",
    "Available category slugs:",
    PRODUCT_CATEGORY_SLUGS.join(", "),
  ];
  return parts.filter((p) => p !== null).join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  // Fetch products
  let query = supabase
    .from("subscriber_products")
    .select(`
      id, name, brand, product_type, product_category_id,
      product_ingredients(name)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (!force) {
    query = query.is("product_category_id", null);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Failed to fetch products:", error);
    process.exit(1);
  }

  if (!products?.length) {
    console.log("No products to classify.");
    return;
  }

  console.log(`Classifying ${products.length} products${userId ? ` (user: ${userId})` : " (all users)"}${force ? " (force reclassify)" : ""}...\n`);

  // Load category slug → ID map
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, slug");

  const slugToId = new Map((categories ?? []).map((c) => [c.slug, c.id]));

  const CONCURRENCY = 10;
  const limit = pLimit(CONCURRENCY);
  let classified = 0;
  let skipped = 0;
  let errors = 0;

  await Promise.all(
    products.map((product: any) =>
      limit(async () => {
        const ingredientNames: string[] = (product.product_ingredients ?? []).map((i: any) => i.name);

        try {
          const { object } = await generateObject({
            model: google("gemini-3-flash-preview"),
            schema: ClassificationSchema,
            system: SYSTEM_PROMPT,
            prompt: buildPrompt({
              name: product.name,
              brand: product.brand,
              product_type: product.product_type,
              ingredients: ingredientNames,
            }),
          });

          const slug = object.category_slug;
          const categoryId = slugToId.get(slug);

          if (!categoryId) {
            console.warn(`  ⚠ "${product.name}" → slug "${slug}" not in product_categories table`);
            skipped++;
            return;
          }

          const { error: updateError } = await supabase
            .from("subscriber_products")
            .update({ product_category_id: categoryId })
            .eq("id", product.id);

          if (updateError) {
            console.error(`  ✗ "${product.name}" update failed:`, updateError.message);
            errors++;
            return;
          }

          classified++;
          console.log(`  ✓ ${product.name} → ${slug}`);
        } catch (err: any) {
          console.error(`  ✗ "${product.name}" failed: ${err.message}`);
          errors++;
        }
      })
    )
  );

  console.log(`\nDone: ${classified} classified, ${skipped} skipped, ${errors} errors`);
}

run().then(() => process.exit(0));
