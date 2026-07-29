import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getStripe, getAdditionalProductPriceId, ADDON_LOOKUP_KEY } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { track } from "@/lib/analytics";
import { isDev, DEV_USER_ID } from "@/lib/dev";

/**
 * POST /api/stripe/add-product-slot — add one $10/mo product slot beyond the
 * 5 included in Monitor. Bumps the add-on subscription item quantity and
 * max_products together.
 */
export async function POST() {
  let userId: string;
  if (isDev) {
    userId = DEV_USER_ID;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }
    userId = user.id;
  }

  if (!(await checkRateLimit(`add-slot:${userId}`, 5))) {
    return NextResponse.json(
      { error: { message: "Too many requests. Please wait a moment." } },
      { status: 429 }
    );
  }

  const { data: dbUser } = await adminClient
    .from("users")
    .select("access_level, max_products, stripe_subscription_id")
    .eq("id", userId)
    .single();

  if (!dbUser || (dbUser.access_level !== "monitor" && dbUser.access_level !== "monitor_research")) {
    return NextResponse.json(
      { error: { message: "An active Monitor subscription is required." } },
      { status: 400 }
    );
  }
  if (!dbUser.stripe_subscription_id) {
    return NextResponse.json(
      { error: { message: "No billing subscription found — contact support." } },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const priceId = await getAdditionalProductPriceId();
    const subscription = await stripe.subscriptions.retrieve(dbUser.stripe_subscription_id);

    const addonItem = subscription.items.data.find(
      (item) => item.price.id === priceId || item.price.lookup_key === ADDON_LOOKUP_KEY
    );
    const prevQuantity = addonItem?.quantity ?? 0;
    const newQuantity = prevQuantity + 1;

    if (addonItem) {
      await stripe.subscriptionItems.update(addonItem.id, {
        quantity: newQuantity,
        proration_behavior: "create_prorations",
      });
    } else {
      await stripe.subscriptionItems.create({
        subscription: subscription.id,
        price: priceId,
        quantity: 1,
        proration_behavior: "create_prorations",
      });
    }

    // Re-read after the billing change and anchor on Stripe's quantity: the
    // included base (5, or a manually-granted custom limit) is whatever the
    // limit was beyond the PREVIOUS add-on quantity.
    const { data: freshUser } = await adminClient
      .from("users")
      .select("max_products")
      .eq("id", userId)
      .single();
    const includedBase = (freshUser?.max_products ?? dbUser.max_products) - prevQuantity;
    const newMax = includedBase + newQuantity;
    const { error: updateError } = await adminClient
      .from("users")
      .update({ max_products: newMax })
      .eq("id", userId);
    if (updateError) {
      console.error("[stripe/add-slot] max_products update failed after billing change:", updateError.message);
      return NextResponse.json(
        { error: { message: "Billing updated but limit change failed — contact support." } },
        { status: 500 }
      );
    }

    track(userId, "product_slot_added", { max_products: newMax });
    return NextResponse.json({ max_products: newMax });
  } catch (err) {
    console.error("[stripe/add-slot] error:", err);
    return NextResponse.json(
      { error: { message: "Could not add a product slot. Please try again." } },
      { status: 500 }
    );
  }
}
