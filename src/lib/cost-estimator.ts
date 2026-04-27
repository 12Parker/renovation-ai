import type { CostEstimate, CostLineItem } from "@/lib/models/room-analysis";

const GOAL_TO_CATEGORIES: Record<string, CostLineItem["category"][]> = {
  flooring: ["Flooring"],
  paint: ["Paint"],
  "better lighting": ["Lighting", "Electrical"],
  "built-ins": ["Built-ins"],
  storage: ["Built-ins", "Furniture"],
  layout: ["Labour", "Electrical", "Plumbing"],
};

const BASE_CATEGORY_COSTS: Record<CostLineItem["category"], { diy: number; contractor: number }> = {
  Flooring: { diy: 1400, contractor: 4600 },
  Paint: { diy: 450, contractor: 1800 },
  Lighting: { diy: 350, contractor: 2200 },
  "Built-ins": { diy: 1200, contractor: 5400 },
  Plumbing: { diy: 350, contractor: 4200 },
  Electrical: { diy: 300, contractor: 3200 },
  Furniture: { diy: 1200, contractor: 2400 },
  Labour: { diy: 250, contractor: 6500 },
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

function roundToNearestFifty(value: number): number {
  return Math.round(value / 50) * 50;
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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
  const targetedCategories = new Set<CostLineItem["category"]>();
  goals.forEach((goal) => {
    GOAL_TO_CATEGORIES[goal]?.forEach((category) => {
      targetedCategories.add(category);
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

  const lineItems = (Object.keys(BASE_CATEGORY_COSTS) as CostLineItem["category"][]).map((category) => {
    const base = BASE_CATEGORY_COSTS[category];
    const includedInFullRenovation = category === "Labour" || targetedCategories.has(category);
    const includedInDiyRefresh = category !== "Labour" && targetedCategories.has(category);

    return {
      category,
      diyCost: roundToNearestFifty(base.diy * multiplier),
      contractorCost: roundToNearestFifty(base.contractor * multiplier),
      includedInDiyRefresh,
      includedInFullRenovation,
    };
  });

  const diyRefreshTotal = lineItems.reduce((sum, item) => (item.includedInDiyRefresh ? sum + item.diyCost : sum), 0);
  const fullRenovationTotal = lineItems.reduce(
    (sum, item) => (item.includedInFullRenovation ? sum + item.contractorCost : sum),
    0,
  );

  return {
    lineItems,
    diyRefreshTotal,
    fullRenovationTotal,
  };
}
