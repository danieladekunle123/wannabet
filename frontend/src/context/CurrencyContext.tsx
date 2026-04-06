import React, { createContext, useContext, useEffect, useState } from "react";
import { getRates } from "../services/currencyService";

export type SupportedCurrency = "EUR" | "USD" | "GBP";

interface CurrencyContextValue {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  rates: Record<string, number>;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "EUR",
  setCurrency: () => {},
  rates: { EUR: 1, USD: 1.08, GBP: 0.86 },
});

const STORAGE_KEY = "currency";

function detectDefaultCurrency(): SupportedCurrency {
  const stored = localStorage.getItem(STORAGE_KEY) as SupportedCurrency | null;
  if (stored && ["EUR", "USD", "GBP"].includes(stored)) return stored;
  // Auto-detect from browser locale
  const locale = navigator.language || "";
  if (locale.startsWith("en-US")) return "USD";
  if (locale.startsWith("en-GB")) return "GBP";
  return "EUR";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(
    detectDefaultCurrency,
  );
  const [rates, setRates] = useState<Record<string, number>>({
    EUR: 1,
    USD: 1.08,
    GBP: 0.86,
  });

  useEffect(() => {
    getRates()
      .then(setRates)
      .catch(() => {});
  }, []);

  function setCurrency(c: SupportedCurrency) {
    localStorage.setItem(STORAGE_KEY, c);
    setCurrencyState(c);
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
