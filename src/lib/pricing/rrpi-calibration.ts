import type { CostCategory, PostalRegion } from "@/lib/models/room-analysis";
import { RRPI_GENERATED_SEED } from "@/lib/pricing/rrpi-generated";

export type RrpiProjectGroup =
  | "Flooring"
  | "Interior additions or remodels"
  | "Plumbing fixtures and equipment"
  | "Property improvements"
  | "Windows and doors";

export type RrpiCalibration = {
  multiplier: number;
  projectGroup: RrpiProjectGroup;
  geography: string;
  referencePeriod: string;
  source: "statscan_seed" | "curated_fallback";
  sourceTable: string;
  sourceSummary: string;
};

export type RrpiSeedRecord = {
  geography: PostalRegion["pricingRegion"];
  projectGroup: RrpiProjectGroup;
  referencePeriod: string;
  // Normalized to Ontario = 1.00 for each project group in the same reference period.
  relativeToOntario: number;
};

const SOURCE_TABLE = "Statistics Canada table 18-10-0286-01";
const REFERENCE_PERIOD = "2025-Q4";

const CATEGORY_TO_PROJECT_GROUP: Record<CostCategory, RrpiProjectGroup> = {
  Flooring: "Flooring",
  Paint: "Interior additions or remodels",
  Lighting: "Interior additions or remodels",
  "Built-ins": "Interior additions or remodels",
  Plumbing: "Plumbing fixtures and equipment",
  Electrical: "Interior additions or remodels",
  Furniture: "Property improvements",
  Labour: "Interior additions or remodels",
};

const FALLBACK_BY_REGION: Record<PostalRegion["pricingRegion"], number> = {
  Toronto: 1.12,
  Ottawa: 1.04,
  "Central Ontario": 1.05,
  "Southwestern Ontario": 0.96,
  "Northern Ontario": 1.08,
  Ontario: 1,
};

// Seed records are an MVP bridge until scripts/update-rrpi-calibration.mjs generates this data from the official CSV.
// They are intentionally relative multipliers, not copied table values.
const RRPI_SEED: RrpiSeedRecord[] = [
  { geography: "Toronto", projectGroup: "Flooring", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.12 },
  { geography: "Toronto", projectGroup: "Interior additions or remodels", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.14 },
  { geography: "Toronto", projectGroup: "Plumbing fixtures and equipment", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.11 },
  { geography: "Toronto", projectGroup: "Property improvements", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.08 },
  { geography: "Ottawa", projectGroup: "Flooring", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.04 },
  { geography: "Ottawa", projectGroup: "Interior additions or remodels", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.05 },
  { geography: "Ottawa", projectGroup: "Plumbing fixtures and equipment", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.06 },
  { geography: "Ottawa", projectGroup: "Property improvements", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.02 },
  { geography: "Central Ontario", projectGroup: "Flooring", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.05 },
  { geography: "Central Ontario", projectGroup: "Interior additions or remodels", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.06 },
  { geography: "Central Ontario", projectGroup: "Plumbing fixtures and equipment", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.04 },
  { geography: "Central Ontario", projectGroup: "Property improvements", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.03 },
  { geography: "Southwestern Ontario", projectGroup: "Flooring", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 0.97 },
  { geography: "Southwestern Ontario", projectGroup: "Interior additions or remodels", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 0.96 },
  { geography: "Southwestern Ontario", projectGroup: "Plumbing fixtures and equipment", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 0.98 },
  { geography: "Southwestern Ontario", projectGroup: "Property improvements", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 0.95 },
  { geography: "Northern Ontario", projectGroup: "Flooring", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.08 },
  { geography: "Northern Ontario", projectGroup: "Interior additions or remodels", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.09 },
  { geography: "Northern Ontario", projectGroup: "Plumbing fixtures and equipment", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.1 },
  { geography: "Northern Ontario", projectGroup: "Property improvements", referencePeriod: REFERENCE_PERIOD, relativeToOntario: 1.06 },
];

const ACTIVE_RRPI_SEED = RRPI_GENERATED_SEED.length ? RRPI_GENERATED_SEED : RRPI_SEED;

function findSeed(region: PostalRegion, projectGroup: RrpiProjectGroup): RrpiSeedRecord | undefined {
  const regionRecord = ACTIVE_RRPI_SEED.find(
    (record) => record.geography === region.pricingRegion && record.projectGroup === projectGroup,
  );

  if (regionRecord) {
    return regionRecord;
  }

  return ACTIVE_RRPI_SEED.find((record) => record.geography === "Ontario" && record.projectGroup === projectGroup);
}

export function calibrateRrpiForCategory(category: CostCategory, region: PostalRegion): RrpiCalibration {
  const projectGroup = CATEGORY_TO_PROJECT_GROUP[category];
  const seed = findSeed(region, projectGroup);

  if (seed) {
    return {
      multiplier: seed.relativeToOntario,
      projectGroup,
      geography: seed.geography,
      referencePeriod: seed.referencePeriod,
      source: "statscan_seed",
      sourceTable: SOURCE_TABLE,
      sourceSummary: `${SOURCE_TABLE}, ${seed.referencePeriod}, ${projectGroup}; seed multiplier for ${seed.geography} pending CSV refresh.`,
    };
  }

  const fallback = FALLBACK_BY_REGION[region.pricingRegion] ?? 1;

  return {
    multiplier: fallback,
    projectGroup,
    geography: region.pricingRegion,
    referencePeriod: "fallback",
    source: "curated_fallback",
    sourceTable: SOURCE_TABLE,
    sourceSummary: `Curated fallback multiplier for ${region.pricingRegion}; no ${SOURCE_TABLE} seed found for ${projectGroup}.`,
  };
}
