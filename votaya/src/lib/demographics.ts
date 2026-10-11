export const AGE_RANGES = ["16-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;

export const GENDERS = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "no-binario", label: "No binario" },
  { value: "no-indica", label: "Prefiero no decirlo" },
] as const;

export const GENDER_VALUES = GENDERS.map((g) => g.value) as string[];

export function genderLabel(v: string | null | undefined) {
  return GENDERS.find((g) => g.value === v)?.label ?? "—";
}

// Códigos ISO 3166-1 alpha-2. Los nombres se obtienen con Intl.DisplayNames.
export const COUNTRY_CODES = (
  "ES MX AR CO CL PE VE EC GT CU BO DO HN PY SV NI CR PA UY PR US CA BR PT FR IT DE GB IE NL BE CH AT " +
  "SE NO DK FI PL CZ RO GR HU UA RU TR MA DZ TN EG NG ZA KE SA AE IL IN PK BD CN JP KR ID PH VN TH MY SG AU NZ"
).split(" ");

const names = new Intl.DisplayNames(["es"], { type: "region" });

export function countryName(code: string | null | undefined): string {
  if (!code) return "—";
  try {
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "🏳️";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export const COUNTRIES_SORTED = COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) =>
  a.name.localeCompare(b.name, "es"),
);
