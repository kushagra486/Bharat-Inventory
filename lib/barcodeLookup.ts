// ─── Open Food Facts Barcode Lookup ────────────────────────────────────────────
// 100% free, open-source, no API key, no rate limit, no trial.
// https://world.openfoodfacts.org/data
// Covers millions of real packaged products worldwide, strong India coverage.

export interface ExternalProductInfo {
  name?: string;
  brand?: string;
  imageUrl?: string;
  categoryGuess?: string; // best-effort text category from OFF, mapped to local categories separately
  quantity?: string;      // e.g. "500g", "1L" — informational only, not auto-applied to qty field
  found: boolean;
}

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/product';

/**
 * Looks up a barcode against Open Food Facts.
 * Returns found:false (not an error) when the product simply isn't in the database —
 * this is common and expected, the user just fills the form manually in that case.
 */
export async function lookupBarcode(barcode: string): Promise<ExternalProductInfo> {
  try {
    const res = await fetch(
      `${OFF_BASE}/${encodeURIComponent(barcode)}.json?fields=product_name,brands,image_front_url,image_url,categories,quantity`,
      { headers: { 'User-Agent': 'BharatInventory/1.0 (expiry-tracker-app)' } }
    );

    if (!res.ok) return { found: false };

    const json = await res.json();

    if (json.status !== 1 || !json.product) {
      return { found: false };
    }

    const p = json.product;
    return {
      found: true,
      name: p.product_name || undefined,
      brand: p.brands || undefined,
      imageUrl: p.image_front_url || p.image_url || undefined,
      categoryGuess: p.categories?.split(',')[0]?.trim() || undefined,
      quantity: p.quantity || undefined,
    };
  } catch {
    // Network failure, offline, etc — fail soft, never block the user.
    return { found: false };
  }
}

/**
 * Maps an Open Food Facts free-text category to one of our fixed local category names.
 * Best-effort keyword matching — falls back to "Others" (caller resolves the actual id).
 */
export function guessLocalCategory(offCategory?: string): string {
  if (!offCategory) return 'Others';
  const c = offCategory.toLowerCase();

  if (/milk|dairy|cheese|yogurt|yoghurt|paneer|butter|ghee/.test(c)) return 'Dairy';
  if (/fruit/.test(c)) return 'Fruits';
  if (/vegetable/.test(c)) return 'Vegetables';
  if (/medicine|pharma|drug|tablet|capsule/.test(c)) return 'Medicines';
  if (/cosmetic|skincare|shampoo|soap|lotion/.test(c)) return 'Cosmetics';
  if (/frozen/.test(c)) return 'Frozen Food';
  if (/bread|bakery|cake|biscuit|cookie/.test(c)) return 'Bakery';
  if (/beverage|drink|juice|soda|water|tea|coffee/.test(c)) return 'Beverages';
  if (/electronic/.test(c)) return 'Electronics';
  if (/grocery|snack|food|canned|cereal|pasta|rice|sauce/.test(c)) return 'Grocery';

  return 'Others';
}
