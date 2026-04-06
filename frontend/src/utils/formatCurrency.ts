/**
 * Format a EUR-cent amount into a display string for the given currency.
 *
 * All values in the app are stored as EUR cents (integer).
 * Steps:
 *   1. cents → EUR (÷ 100)
 *   2. EUR → target currency (× rate)
 *   3. Format with Intl.NumberFormat using correct symbol
 *
 * @param amountInEurCents - integer EUR cents (e.g. 10000 = €100.00)
 * @param currency         - target display currency ("EUR" | "USD" | "GBP")
 * @param rates            - exchange-rate map from CurrencyContext
 */
export function formatCurrency(
  amountInEurCents: number,
  currency: string,
  rates: Record<string, number>,
): string {
  const rate = rates[currency] ?? 1;
  const value = (amountInEurCents / 100) * rate;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback for unknown currency codes
    const symbols: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };
    const sym = symbols[currency] ?? currency + " ";
    return `${sym}${value.toFixed(2)}`;
  }
}

/**
 * Same as formatCurrency but accepts a plain decimal (e.g. 100.00) rather
 * than cents. Use this for amounts that are already in EUR (not cents).
 */
export function formatCurrencyFromEur(
  amountInEur: number,
  currency: string,
  rates: Record<string, number>,
): string {
  return formatCurrency(Math.round(amountInEur * 100), currency, rates);
}
