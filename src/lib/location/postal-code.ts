import type { PostalRegion } from "@/lib/models/room-analysis";

const ONTARIO_PREFIXES = new Set(["K", "L", "M", "N", "P"]);

const DEFAULT_REGION: PostalRegion = {
  postalCode: "",
  fsa: "",
  province: "unknown",
  regionName: "Ontario fallback",
  pricingRegion: "Ontario",
  isOntario: false,
  regionalMultiplier: 1,
  sourceSummary: "No Ontario postal code supplied; using Ontario-wide planning defaults.",
};

function formatPostalCode(value: string): string {
  const normalized = value.trim().replace(/\s+/g, "").toUpperCase();
  if (normalized.length <= 3) {
    return normalized;
  }

  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)}`;
}

function resolveOntarioRegion(fsa: string): Omit<PostalRegion, "postalCode" | "fsa" | "province" | "isOntario" | "sourceSummary"> {
  const first = fsa[0];
  const second = fsa[1];

  if (first === "M") {
    return {
      regionName: "Metropolitan Toronto",
      pricingRegion: "Toronto",
      cma: "Toronto",
      regionalMultiplier: 1.12,
    };
  }

  if (first === "K") {
    return {
      regionName: second === "1" || second === "2" || second === "4" ? "Ottawa and eastern Ontario" : "Eastern Ontario",
      pricingRegion: "Ottawa",
      cma: second === "1" || second === "2" || second === "4" ? "Ottawa" : undefined,
      regionalMultiplier: second === "0" ? 1.04 : 1.02,
    };
  }

  if (first === "L") {
    return {
      regionName: "Central Ontario and Golden Horseshoe",
      pricingRegion: "Central Ontario",
      regionalMultiplier: 1.05,
    };
  }

  if (first === "N") {
    return {
      regionName: "Southwestern Ontario",
      pricingRegion: "Southwestern Ontario",
      cma: fsa.startsWith("N5") || fsa.startsWith("N6") ? "London" : undefined,
      regionalMultiplier: 0.96,
    };
  }

  return {
    regionName: "Northern Ontario",
    pricingRegion: "Northern Ontario",
    regionalMultiplier: 1.08,
  };
}

export function normalizePostalCode(value: string): string {
  return formatPostalCode(value);
}

export function resolvePostalRegion(postalCode: string): PostalRegion {
  const normalizedPostalCode = formatPostalCode(postalCode);
  const compact = normalizedPostalCode.replace(/\s+/g, "");
  const fsa = compact.slice(0, 3);
  const first = fsa[0];

  if (fsa.length < 3 || !first || !ONTARIO_PREFIXES.has(first)) {
    return {
      ...DEFAULT_REGION,
      postalCode: normalizedPostalCode,
      fsa,
      sourceSummary: normalizedPostalCode
        ? "Postal code is outside the Ontario prefix set K/L/M/N/P or too short; using Ontario-wide planning defaults."
        : DEFAULT_REGION.sourceSummary,
    };
  }

  return {
    postalCode: normalizedPostalCode,
    fsa,
    province: "ON",
    isOntario: true,
    sourceSummary: "Region inferred from the postal code FSA; use licensed address validation for production-grade location matching.",
    ...resolveOntarioRegion(fsa),
  };
}
