import { resolvePostalRegion } from "@/lib/location/postal-code";
import type {
  CostCategory,
  CostEstimate,
  CostLineItem,
  CostRange,
  EstimateQualityTier,
  HomeAgeBand,
  QuantitySource,
  ScopeComplexity,
} from "@/lib/models/room-analysis";
import { getCatalogItem } from "@/lib/pricing/catalog";
import { calibrateRrpiForCategory } from "@/lib/pricing/rrpi-calibration";

const COST_CATEGORIES: CostCategory[] = ["Flooring", "Paint", "Lighting", "Built-ins", "Plumbing", "Electrical", "Furniture", "Labour"];

const GOAL_TO_CATEGORIES: Record<string, CostCategory[]> = {
  flooring: ["Flooring"],
  paint: ["Paint"],
  "better lighting": ["Lighting", "Electrical"],
  "built-ins": ["Built-ins"],
  storage: ["Built-ins", "Furniture"],
  layout: ["Labour", "Electrical", "Plumbing"],
};

const GOAL_KEYWORD_TO_CATEGORIES: Array<{ keyword: string; categories: CostCategory[] }> = [
  { keyword: "light", categories: ["Lighting", "Electrical"] },
  { keyword: "floor", categories: ["Flooring"] },
  { keyword: "paint", categories: ["Paint"] },
  { keyword: "storage", categories: ["Built-ins", "Furniture"] },
  { keyword: "closet", categories: ["Built-ins", "Furniture"] },
  { keyword: "cabinet", categories: ["Built-ins"] },
  { keyword: "layout", categories: ["Labour", "Electrical", "Plumbing"] },
  { keyword: "open concept", categories: ["Labour", "Electrical", "Plumbing"] },
  { keyword: "plumbing", categories: ["Plumbing"] },
  { keyword: "sink", categories: ["Plumbing"] },
  { keyword: "laundry", categories: ["Plumbing", "Electrical"] },
  { keyword: "electrical", categories: ["Electrical"] },
  { keyword: "outlet", categories: ["Electrical"] },
  { keyword: "furniture", categories: ["Furniture"] },
  { keyword: "seating", categories: ["Furniture"] },
];

const CONTRACTOR_TASK_KEYWORDS: Array<{ keyword: string; categories: CostCategory[] }> = [
  { keyword: "electric", categories: ["Electrical", "Lighting"] },
  { keyword: "circuit", categories: ["Electrical"] },
  { keyword: "panel", categories: ["Electrical"] },
  { keyword: "plumb", categories: ["Plumbing"] },
  { keyword: "rough-in", categories: ["Plumbing", "Electrical"] },
  { keyword: "sink", categories: ["Plumbing"] },
  { keyword: "built-in", categories: ["Built-ins"] },
  { keyword: "cabinet", categories: ["Built-ins"] },
  { keyword: "floor", categories: ["Flooring"] },
  { keyword: "paint", categories: ["Paint"] },
  { keyword: "structural", categories: ["Labour"] },
  { keyword: "permit", categories: ["Labour"] },
];

const ROOM_AREA_DEFAULTS: Record<string, number> = {
  basement: 450,
  bedroom: 160,
  kitchen: 180,
  "laundry room": 90,
  office: 140,
  "living room": 260,
};

const QUALITY_TIER_FACTORS: Record<EstimateQualityTier, number> = {
  budget: 0.88,
  standard: 1,
  premium: 1.35,
};

const HOME_AGE_FACTORS: Record<HomeAgeBand, number> = {
  pre_1960: 1.18,
  "1960_1990": 1.1,
  "1990_2010": 1.04,
  "2010_plus": 1,
};

const COMPLEXITY_FACTORS: Record<ScopeComplexity, number> = {
  cosmetic: 0.9,
  moderate: 1,
  major: 1.25,
};

const STYLE_FACTORS: Record<string, number> = {
  "cozy modern": 1.04,
  vintage: 1.1,
  Tudor: 1.14,
  Scandinavian: 1.02,
  moody: 1.08,
  minimalist: 0.96,
};

const CONTINGENCY_BY_COMPLEXITY: Record<ScopeComplexity, number> = {
  cosmetic: 10,
  moderate: 14,
  major: 18,
};

export type CostEstimateInput = {
  goals: string[];
  roomType: string;
  style: string;
  contractorTasks?: string[];
  postalCode?: string;
  roomAreaSqft?: number;
  qualityTier?: EstimateQualityTier;
  homeAgeBand?: HomeAgeBand;
  scopeComplexity?: ScopeComplexity;
};

function roundToNearestFifty(value: number): number {
  return Math.round(value / 50) * 50;
}

function roundQuantity(value: number): number {
  return Math.round(value * 10) / 10;
}

function multiplyRange(range: CostRange, multiplier: number): CostRange {
  return {
    low: roundToNearestFifty(range.low * multiplier),
    typical: roundToNearestFifty(range.typical * multiplier),
    high: roundToNearestFifty(range.high * multiplier),
  };
}

function sumRanges(ranges: CostRange[]): CostRange {
  return ranges.reduce(
    (total, range) => ({
      low: total.low + range.low,
      typical: total.typical + range.typical,
      high: total.high + range.high,
    }),
    { low: 0, typical: 0, high: 0 },
  );
}

function addContingency(range: CostRange, contingencyPercent: number): CostRange {
  const multiplier = 1 + contingencyPercent / 100;

  return {
    low: range.low,
    typical: roundToNearestFifty(range.typical * multiplier),
    high: roundToNearestFifty(range.high * multiplier),
  };
}

function categoryTargets(goals: string[], contractorTasks: string[]): Set<CostCategory> {
  const targetedCategories = new Set<CostCategory>();

  goals.forEach((goal) => {
    GOAL_TO_CATEGORIES[goal]?.forEach((category) => targetedCategories.add(category));

    const normalizedGoal = goal.toLowerCase();
    GOAL_KEYWORD_TO_CATEGORIES.forEach(({ keyword, categories }) => {
      if (normalizedGoal.includes(keyword)) {
        categories.forEach((category) => targetedCategories.add(category));
      }
    });
  });

  contractorTasks.forEach((task) => {
    const normalizedTask = task.toLowerCase();
    CONTRACTOR_TASK_KEYWORDS.forEach(({ keyword, categories }) => {
      if (normalizedTask.includes(keyword)) {
        categories.forEach((category) => targetedCategories.add(category));
      }
    });
  });

  if (!targetedCategories.size) {
    targetedCategories.add("Paint");
    targetedCategories.add("Lighting");
    targetedCategories.add("Furniture");
  }

  return targetedCategories;
}

function defaultArea(roomType: string): number {
  return ROOM_AREA_DEFAULTS[roomType.toLowerCase()] ?? 180;
}

function roomArea(input: CostEstimateInput): { value: number; source: QuantitySource } {
  if (input.roomAreaSqft && input.roomAreaSqft >= 40) {
    return { value: input.roomAreaSqft, source: "user" };
  }

  return { value: defaultArea(input.roomType), source: "room_default" };
}

function quantityForCategory({
  category,
  area,
  roomType,
  complexity,
}: {
  category: CostCategory;
  area: number;
  roomType: string;
  complexity: ScopeComplexity;
}): { quantity: number; quantityLabel: string; quantitySource: QuantitySource } {
  const normalizedRoom = roomType.toLowerCase();

  if (category === "Flooring") {
    return { quantity: area, quantityLabel: `${area} sqft floor area`, quantitySource: "user" };
  }

  if (category === "Paint") {
    const paintableArea = Math.round(area * 2.7);
    return { quantity: paintableArea, quantityLabel: `${paintableArea} sqft paintable surface`, quantitySource: "scope_default" };
  }

  if (category === "Lighting") {
    const fixtures = Math.max(2, Math.ceil(area / (complexity === "major" ? 90 : 130)));
    return { quantity: fixtures, quantityLabel: `${fixtures} fixtures`, quantitySource: "scope_default" };
  }

  if (category === "Built-ins") {
    const linearFeet = Math.max(5, Math.round(area / 35));
    return { quantity: linearFeet, quantityLabel: `${linearFeet} linear feet`, quantitySource: "scope_default" };
  }

  if (category === "Plumbing") {
    const fixtures = normalizedRoom === "kitchen" || normalizedRoom === "laundry room" ? 2 : 1;
    return { quantity: fixtures, quantityLabel: `${fixtures} plumbing fixture allowances`, quantitySource: "scope_default" };
  }

  if (category === "Electrical") {
    const devices = Math.max(1, Math.ceil(area / 160));
    return { quantity: devices, quantityLabel: `${devices} electrical allowances`, quantitySource: "scope_default" };
  }

  if (category === "Furniture") {
    return { quantity: 1, quantityLabel: "1 furniture and styling allowance", quantitySource: "catalog_allowance" };
  }

  return { quantity: area, quantityLabel: `${area} sqft project area`, quantitySource: "scope_default" };
}

function confidenceForEstimate(hasPostalCode: boolean, roomAreaSource: QuantitySource, hasLowConfidenceLine: boolean): CostEstimate["confidence"] {
  if (!hasPostalCode || roomAreaSource !== "user" || hasLowConfidenceLine) {
    return "directional";
  }

  return "planning";
}

export function buildLocationAwareCostEstimate(input: CostEstimateInput): CostEstimate {
  const region = resolvePostalRegion(input.postalCode ?? "");
  const qualityTier = input.qualityTier ?? "standard";
  const homeAgeBand = input.homeAgeBand ?? "1990_2010";
  const scopeComplexity = input.scopeComplexity ?? "moderate";
  const area = roomArea(input);
  const targetedCategories = categoryTargets(input.goals, input.contractorTasks ?? []);
  const qualityTierFactor = QUALITY_TIER_FACTORS[qualityTier];
  const homeAgeFactor = HOME_AGE_FACTORS[homeAgeBand];
  const complexityFactor = COMPLEXITY_FACTORS[scopeComplexity];
  const styleFactor = STYLE_FACTORS[input.style] ?? 1;

  const lineItems = COST_CATEGORIES.map((category): CostLineItem => {
    const catalogItem = getCatalogItem(category);
    const includedInFullRenovation = category === "Labour" || targetedCategories.has(category);
    const includedInDiyRefresh = category !== "Labour" && targetedCategories.has(category);
    const quantity = quantityForCategory({
      category,
      area: area.value,
      roomType: input.roomType,
      complexity: scopeComplexity,
    });
    const calibration = calibrateRrpiForCategory(category, region);
    const sharedMultiplier = calibration.multiplier * qualityTierFactor * homeAgeFactor * complexityFactor * styleFactor;
    const contractorRange = multiplyRange(catalogItem.contractorUnitCost, quantity.quantity * sharedMultiplier);
    const diyRange = multiplyRange(catalogItem.diyUnitCost, quantity.quantity * qualityTierFactor * styleFactor);

    return {
      category,
      diyCost: diyRange.typical,
      contractorCost: contractorRange.typical,
      diyRange,
      contractorRange,
      includedInDiyRefresh,
      includedInFullRenovation,
      scopeNote: catalogItem.scopeNote,
      contractorSpecialty: catalogItem.contractorSpecialty,
      catalogItemId: catalogItem.id,
      label: catalogItem.label,
      unit: catalogItem.unit,
      quantity: roundQuantity(quantity.quantity),
      quantityLabel: quantity.quantityLabel,
      quantitySource: quantity.quantitySource === "user" && area.source !== "user" ? "room_default" : quantity.quantitySource,
      unitCostRange: catalogItem.contractorUnitCost,
      regionalMultiplier: region.regionalMultiplier,
      calibrationMultiplier: calibration.multiplier,
      calibrationSource: calibration.sourceSummary,
      calibrationReferencePeriod: calibration.referencePeriod,
      qualityTierFactor,
      complexityFactor,
      homeAgeFactor,
      sourceSummary: [...catalogItem.sourceSummary, calibration.sourceSummary],
      confidence: catalogItem.confidence,
    };
  });

  const contingencyPercent = CONTINGENCY_BY_COMPLEXITY[scopeComplexity];
  const diyRefreshRange = sumRanges(
    lineItems.filter((item) => item.includedInDiyRefresh).map((item) => item.diyRange),
  );
  const fullRenovationRange = addContingency(
    sumRanges(lineItems.filter((item) => item.includedInFullRenovation).map((item) => item.contractorRange)),
    contingencyPercent,
  );
  const hasLowConfidenceLine = lineItems.some((item) => item.includedInFullRenovation && item.confidence === "low");
  const calibrationSources = Array.from(
    new Set(lineItems.filter((item) => item.includedInFullRenovation).map((item) => item.calibrationSource)),
  );

  return {
    lineItems,
    diyRefreshTotal: diyRefreshRange.typical,
    fullRenovationTotal: fullRenovationRange.typical,
    diyRefreshRange,
    fullRenovationRange,
    contingencyPercent,
    confidence: confidenceForEstimate(region.isOntario, area.source, hasLowConfidenceLine),
    assumptions: [
      "Ranges are planning estimates, not contractor bids.",
      `${area.source === "user" ? "User supplied" : "Default"} room area: ${area.value} sqft.`,
      `Location basis: ${region.regionName}; each category uses a renovation-project calibration multiplier where available.`,
      `Quality tier: ${qualityTier}; scope complexity: ${scopeComplexity}; home age: ${homeAgeBand.replace("_", "-")}.`,
      "Quantities are editable assumptions and should be replaced with measured quantities before requesting fixed bids.",
    ],
    exclusions: [
      "HST, permit fees, design fees, engineering, and hazardous-material remediation.",
      "Hidden damage, structural repairs, utility upgrades, and premium custom fabrication unless explicitly scoped.",
      "Accepted contractor bids can differ from planning ranges because of site access, schedule pressure, and contractor minimums.",
    ],
    sourceSummary: [
      "Absolute unit costs come from the local Ontario planning catalog seeded for 2026-Q1.",
      "Category calibration is mapped to StatsCan RRPI project groups from table 18-10-0286-01, with curated fallback multipliers where table seeds are not present.",
      ...calibrationSources,
      region.sourceSummary,
    ],
    region,
    inputs: {
      postalCode: region.postalCode,
      roomAreaSqft: area.value,
      roomAreaSource: area.source,
      qualityTier,
      homeAgeBand,
      scopeComplexity,
    },
  };
}
