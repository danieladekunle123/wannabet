import axios from "axios";
import { mapCountryToMatchmakingRegion } from "./ipinfoService";

export type CountryRecord = {
  name: string;
  code: string;
  flag: string;
  region: string;
  timezones: string[];
  matchmakingRegion: string;
};

type RestCountry = {
  name?: { common?: string };
  cca2?: string;
  flags?: { png?: string; svg?: string };
  region?: string;
  timezones?: string[];
};

let cachedCountries: CountryRecord[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getCountries() {
  const now = Date.now();
  if (cachedCountries && now < cacheExpiresAt) {
    return cachedCountries;
  }

  const response = await axios.get<RestCountry[]>(
    "https://restcountries.com/v3.1/all",
    {
      timeout: 12000,
    },
  );

  const countries = (response.data || [])
    .map((country) => {
      const name = country.name?.common || "";
      const code = (country.cca2 || "").toUpperCase();
      const flag = country.flags?.png || country.flags?.svg || "";
      const region = country.region || "Unknown";
      const timezones = Array.isArray(country.timezones)
        ? country.timezones
        : [];

      if (!name || !code) return null;

      return {
        name,
        code,
        flag,
        region,
        timezones,
        matchmakingRegion: mapCountryToMatchmakingRegion(code, null, region),
      } satisfies CountryRecord;
    })
    .filter((country): country is CountryRecord => !!country)
    .sort((a, b) => a.name.localeCompare(b.name));

  cachedCountries = countries;
  cacheExpiresAt = now + CACHE_TTL_MS;

  return countries;
}
