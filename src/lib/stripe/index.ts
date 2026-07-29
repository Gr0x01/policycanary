import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Stripe client singleton — server-only, lazily initialized.
 * Defers initialization to avoid build-time failures when env vars aren't set.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing env var: STRIPE_SECRET_KEY is required");
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// ---------------------------------------------------------------------------
// Additional-product add-on ($10/mo per product beyond the 5 included)
// ---------------------------------------------------------------------------

export const ADDON_LOOKUP_KEY = "additional_product_slot";
const ADDON_UNIT_AMOUNT = 1000; // $10.00/mo

let _addonPriceId: string | null = null;

/**
 * Resolve the add-on price: env override, else find by lookup key, else
 * create it. Find-or-create keeps test and live mode both working without
 * manual dashboard setup.
 */
export async function getAdditionalProductPriceId(): Promise<string> {
  if (process.env.STRIPE_PRICE_ADDITIONAL_PRODUCT) {
    return process.env.STRIPE_PRICE_ADDITIONAL_PRODUCT;
  }
  if (_addonPriceId) return _addonPriceId;

  const stripe = getStripe();
  const existing = await stripe.prices.list({
    lookup_keys: [ADDON_LOOKUP_KEY],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) {
    _addonPriceId = existing.data[0].id;
    return _addonPriceId;
  }

  const price = await stripe.prices.create({
    lookup_key: ADDON_LOOKUP_KEY,
    currency: "usd",
    unit_amount: ADDON_UNIT_AMOUNT,
    recurring: { interval: "month" },
    product_data: { name: "Additional monitored product" },
  });
  _addonPriceId = price.id;
  return _addonPriceId;
}
