-- =============================================================================
-- Seed: Sources + Regulatory Categories
-- =============================================================================

-- Sources: 9 data pipelines
INSERT INTO sources (name, source_type, base_url) VALUES
  ('federal_register',   'api',    'https://www.federalregister.gov/api/v1'),
  ('openfda_enforcement','api',    'https://api.fda.gov/food/enforcement.json'),
  ('openfda_caers',      'api',    'https://api.fda.gov/food/event.json'),
  ('fda_rss',            'rss',    'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds'),
  ('warning_letters',    'scrape', 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters'),
  ('prop65',             'csv',    'https://oehha.ca.gov/media/downloads/proposition-65/p65plain.csv'),
  ('cscp',               'csv',    'https://www.calhhs.ca.gov/applications/safe-cosmetics/search/'),
  ('dsld',               'api',    'https://api.ods.od.nih.gov/dsld/'),
  ('usda_fdc',           'api',    'https://api.nal.usda.gov/fdc/v1')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- Regulatory Categories: Segments
-- =============================================================================

INSERT INTO regulatory_categories (slug, label, category_type, sort_order, description) VALUES
  ('supplements', 'Dietary Supplements', 'segment', 1, 'FDA industry code 54. Vitamins, minerals, herbs, botanicals, amino acids, and other dietary ingredients.'),
  ('cosmetics',   'Cosmetics & Personal Care', 'segment', 2, 'FDA industry code 53. Skin care, hair care, color cosmetics, personal hygiene products. MoCRA regulated.'),
  ('food',        'Conventional Food & Beverage', 'segment', 3, 'FDA industry codes 2-9, 12, 15-22, 25, 33-42. Packaged food, beverages, food additives, GRAS substances.')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- Regulatory Categories: Topics (linked to segments)
-- =============================================================================

-- We need to reference the segment UUIDs for parent_id
WITH segs AS (
  SELECT id, slug FROM regulatory_categories WHERE category_type = 'segment'
)
INSERT INTO regulatory_categories (slug, label, category_type, parent_id, sort_order, description)
SELECT v.slug, v.label, 'topic', segs.id, v.sort_order, v.description
FROM (VALUES
  -- Supplements topics
  ('cgmp-violations',      'CGMP Violations',          'supplements', 1, '21 CFR Part 111 manufacturing violations'),
  ('identity-testing',     'Identity Testing',          'supplements', 2, '21 CFR 111.70 ingredient verification requirements'),
  ('ndi-notifications',    'NDI Notifications',         'supplements', 3, 'New dietary ingredient pre-market notifications'),
  -- Cosmetics topics
  ('facility-registration','Facility Registration',     'cosmetics', 1, 'MoCRA mandatory facility registration requirement'),
  ('product-listing',      'Product Listing',           'cosmetics', 2, 'MoCRA mandatory cosmetic product listing requirement'),
  -- Cross-cutting topics (linked to first matching segment; tags handle cross-segment)
  ('labeling-claims',      'Labeling & Claims',         'supplements', 4, 'Structure/function claims, health claims, labeling requirements'),
  ('adverse-events',       'Adverse Event Reporting',   'supplements', 5, 'MedWatch, CFSAN AER, CAERS reports and patterns'),
  ('product-recalls',      'Product Recalls',           'supplements', 6, 'Class I/II/III enforcement recalls'),
  ('import-safety',        'Import Safety & Detention', 'supplements', 7, 'Import alerts, detention without physical examination'),
  -- Food topics
  ('food-additives',       'Food Additives & GRAS',     'food', 1, '21 CFR Parts 170-189 food additives, GRAS determinations'),
  ('allergen-documentation','Allergen Documentation',    'food', 2, 'FSMA / FALCPA allergen labeling and documentation')
) AS v(slug, label, parent_slug, sort_order, description)
JOIN segs ON segs.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- Regulatory Categories: Product Classes
-- =============================================================================

INSERT INTO regulatory_categories (slug, label, category_type, sort_order) VALUES
  ('botanical-supplements', 'Botanical Supplements', 'product_class', 1),
  ('protein-powders',       'Protein Powders',       'product_class', 2),
  ('vitamins-minerals',     'Vitamins & Minerals',   'product_class', 3),
  ('probiotics',            'Probiotics',            'product_class', 4),
  ('skin-care',             'Skin Care Products',    'product_class', 5),
  ('hair-care',             'Hair Care Products',    'product_class', 6),
  ('color-additives',       'Color Additives',       'product_class', 7),
  ('functional-foods',      'Functional Foods',      'product_class', 8)
ON CONFLICT (slug) DO NOTHING;
