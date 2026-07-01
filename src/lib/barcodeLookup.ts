export interface ExternalProductInfo {
  found: boolean; name?: string; brand?: string; imageUrl?: string; categoryGuess?: string;
}
export async function lookupBarcode(barcode: string): Promise<ExternalProductInfo> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,image_front_url,categories`,
      { headers: { 'User-Agent': 'BharatInventory/2.0' } }
    );
    if (!res.ok) return { found: false };
    const j = await res.json();
    if (j.status !== 1 || !j.product) return { found: false };
    const p = j.product;
    return { found: true, name: p.product_name, brand: p.brands, imageUrl: p.image_front_url, categoryGuess: p.categories?.split(',')[0]?.trim() };
  } catch { return { found: false }; }
}
export function guessCategory(cat?: string): string {
  if (!cat) return 'Others';
  const c = cat.toLowerCase();
  if (/milk|dairy|cheese|yogurt|paneer|butter|ghee/.test(c)) return 'Dairy';
  if (/fruit/.test(c)) return 'Fruits';
  if (/vegetable/.test(c)) return 'Vegetables';
  if (/medicine|pharma|tablet|capsule/.test(c)) return 'Medicines';
  if (/cosmetic|skincare|shampoo|soap/.test(c)) return 'Cosmetics';
  if (/frozen/.test(c)) return 'Frozen Food';
  if (/bread|bakery|biscuit|cookie/.test(c)) return 'Bakery';
  if (/beverage|drink|juice|soda|water|tea|coffee/.test(c)) return 'Beverages';
  if (/grocery|snack|food|canned|cereal|pasta|rice/.test(c)) return 'Grocery';
  return 'Others';
}
