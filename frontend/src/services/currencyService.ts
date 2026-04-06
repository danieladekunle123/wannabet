/** EUR is the base currency. All amounts are stored in EUR cents. */

const API_URL =
  "https://v6.exchangerate-api.com/v6/4dbe340849121b81b5be3feb/latest/EUR";

interface RatesCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: RatesCache | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch rates");
    const data = await res.json();
    cache = {
      rates: data.conversion_rates as Record<string, number>,
      fetchedAt: Date.now(),
    };
    return cache.rates;
  } catch {
    // Return 1:1 fallback so the app keeps working offline
    return cache?.rates ?? { EUR: 1, USD: 1.08, GBP: 0.86 };
  }
}

/**
 * Convert a EUR-cent amount to the target currency (as a float).
 * e.g. convertFromEUR(10000, "USD") → ~108.00
 */
export async function convertFromEUR(
  amountInCents: number,
  targetCurrency: string,
): Promise<number> {
  const rates = await getRates();
  const rate = rates[targetCurrency] ?? 1;
  return (amountInCents / 100) * rate;
}
