import type { CostCategory, CostEstimate, CostLineItem, CostRange } from "@/lib/models/room-analysis";

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
  { keyword: "electrical", categories: ["Electrical"] },
  { keyword: "outlet", categories: ["Electrical"] },
  { keyword: "furniture", categories: ["Furniture"] },
  { keyword: "seating", categories: ["Furniture"] },
];

const BASE_CATEGORY_COSTS: Record<
  CostCategory,
  {
    diy: number;
    contractor: number;
    scopeNote: string;
    contractorSpecialty: string;
  }
> = {
  Flooring: {
    diy: 1400,
    contractor: 4600,
    scopeNote: "Finish material, underlayment, transitions, and normal prep.",
    contractorSpecialty: "Flooring installer",
  },
  Paint: {
    diy: 450,
    contractor: 1800,
    scopeNote: "Wall repair, primer, paint, and standard trim touch-ups.",
    contractorSpecialty: "Painter",
  },
  Lighting: {
    diy: 350,
    contractor: 2200,
    scopeNote: "Fixtures, switches, trim kits, and basic placement planning.",
    contractorSpecialty: "Lighting electrician",
  },
  "Built-ins": {
    diy: 1200,
    contractor: 5400,
    scopeNote: "Semi-custom storage, shelving, cabinetry, and finish carpentry.",
    contractorSpecialty: "Finish carpenter",
  },
  Plumbing: {
    diy: 350,
    contractor: 4200,
    scopeNote: "Fixture swaps or limited rough-in allowances; major relocations need bids.",
    contractorSpecialty: "Licensed plumber",
  },
  Electrical: {
    diy: 300,
    contractor: 3200,
    scopeNote: "Outlet, circuit, dimmer, and code-sensitive electrical allowances.",
    contractorSpecialty: "Licensed electrician",
  },
  Furniture: {
    diy: 1200,
    contractor: 2400,
    scopeNote: "Core furnishings, assembly, and styling allowances.",
    contractorSpecialty: "Interior stylist",
  },
  Labour: {
    diy: 250,
    contractor: 6500,
    scopeNote: "General project labour, coordination, protection, and punch-list time.",
    contractorSpecialty: "General contractor",
  },
};

const ROOM_TYPE_MULTIPLIER: Record<string, number> = {
  basement: 1.2,
  bedroom: 0.9,
  kitchen: 1.35,
  "laundry room": 1,
  office: 0.85,
  "living room": 1.1,
};

const STYLE_MULTIPLIER: Record<string, number> = {
  "cozy modern": 1.05,
  vintage: 1.1,
  Tudor: 1.2,
  Scandinavian: 1,
  moody: 1.15,
  minimalist: 0.95,
};

const CONTINGENCY_PERCENT = 12;

function roundToNearestFifty(value: number): number {
  return Math.round(value / 50) * 50;
}

function buildRange(value: number, lowFactor = 0.8, highFactor = 1.3): CostRange {
  return {
    low: roundToNearestFifty(value * lowFactor),
    typical: roundToNearestFifty(value),
    high: roundToNearestFifty(value * highFactor),
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

export function formatCad(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCadRange(range: CostRange): string {
  return `${formatCad(range.low)}-${formatCad(range.high)}`;
}

export function buildCostEstimate({
  goals,
  roomType,
  style,
}: {
  goals: string[];
  roomType: string;
  style: string;
}): CostEstimate {
  const targetedCategories = new Set<CostCategory>();
  goals.forEach((goal) => {
    GOAL_TO_CATEGORIES[goal]?.forEach((category) => {
      targetedCategories.add(category);
    });

    const normalizedGoal = goal.toLowerCase();
    GOAL_KEYWORD_TO_CATEGORIES.forEach(({ keyword, categories }) => {
      if (!normalizedGoal.includes(keyword)) {
        return;
      }

      categories.forEach((category) => {
        targetedCategories.add(category);
      });
    });
  });

  if (!targetedCategories.size) {
    targetedCategories.add("Paint");
    targetedCategories.add("Lighting");
    targetedCategories.add("Furniture");
  }

  const roomMultiplier = ROOM_TYPE_MULTIPLIER[roomType] ?? 1;
  const styleMultiplier = STYLE_MULTIPLIER[style] ?? 1;
  const multiplier = roomMultiplier * styleMultiplier;

  const lineItems = COST_CATEGORIES.map((category): CostLineItem => {
    const base = BASE_CATEGORY_COSTS[category];
    const includedInFullRenovation = category === "Labour" || targetedCategories.has(category);
    const includedInDiyRefresh = category !== "Labour" && targetedCategories.has(category);
    const diyCost = roundToNearestFifty(base.diy * multiplier);
    const contractorCost = roundToNearestFifty(base.contractor * multiplier);

    return {
      category,
      diyCost,
      contractorCost,
      diyRange: buildRange(diyCost, 0.75, 1.25),
      contractorRange: buildRange(contractorCost, 0.85, 1.35),
      includedInDiyRefresh,
      includedInFullRenovation,
      scopeNote: base.scopeNote,
      contractorSpecialty: base.contractorSpecialty,
    };
  });

  const diyRefreshRange = sumRanges(
    lineItems.filter((item) => item.includedInDiyRefresh).map((item) => item.diyRange),
  );
  const fullRenovationRange = addContingency(
    sumRanges(lineItems.filter((item) => item.includedInFullRenovation).map((item) => item.contractorRange)),
    CONTINGENCY_PERCENT,
  );

  return {
    lineItems,
    diyRefreshTotal: diyRefreshRange.typical,
    fullRenovationTotal: fullRenovationRange.typical,
    diyRefreshRange,
    fullRenovationRange,
    contingencyPercent: CONTINGENCY_PERCENT,
    confidence: "planning",
    assumptions: [
      "Ranges are planning estimates, not contractor bids.",
      "Room size is inferred only from selected room type and goals; square footage is not measured yet.",
      "Totals exclude permit fees, hidden damage, design fees, taxes, and premium custom fabrication unless noted by a contractor.",
      "Contractor totals include a planning contingency for early-scope uncertainty.",
    ],
  };
}
