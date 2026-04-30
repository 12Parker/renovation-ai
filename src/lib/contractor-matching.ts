import { formatCad, formatCadRange } from "@/lib/cost-estimator";
import type {
  ContractorMatch,
  ContractorMatchGroup,
  ContractorProfile,
  CostCategory,
  CostEstimate,
  CostLineItem,
  CostRange,
  RoomAnalysis,
} from "@/lib/models/room-analysis";

type ContractorMatchInput = {
  analysis: RoomAnalysis;
  costEstimate: CostEstimate;
  goals: string[];
  roomType: string;
  style: string;
  postalCode: string;
};

type TradeDefinition = {
  trade: string;
  categories: CostCategory[];
  taskKeywords: string[];
};

const TRADE_DEFINITIONS: TradeDefinition[] = [
  {
    trade: "Electrical and lighting",
    categories: ["Electrical", "Lighting"],
    taskKeywords: ["electric", "circuit", "outlet", "switch", "panel", "lighting", "recessed", "fixture", "dimmer"],
  },
  {
    trade: "Plumbing",
    categories: ["Plumbing"],
    taskKeywords: ["plumb", "sink", "faucet", "drain", "water", "toilet", "washer", "rough-in"],
  },
  {
    trade: "Carpentry and built-ins",
    categories: ["Built-ins"],
    taskKeywords: ["built-in", "cabinet", "shelving", "shelf", "millwork", "storage", "carpentry", "closet"],
  },
  {
    trade: "Flooring",
    categories: ["Flooring"],
    taskKeywords: ["floor", "lvp", "vinyl", "hardwood", "tile", "carpet", "underlayment"],
  },
  {
    trade: "Painting",
    categories: ["Paint"],
    taskKeywords: ["paint", "primer", "drywall", "wall repair", "trim"],
  },
  {
    trade: "Interior styling",
    categories: ["Furniture"],
    taskKeywords: ["furniture", "decor", "seating", "layout", "styling", "rug"],
  },
  {
    trade: "General renovation",
    categories: ["Labour"],
    taskKeywords: ["structural", "permit", "demo", "framing", "layout", "wall", "coordination", "contractor"],
  },
];

const MOCK_CONTRACTORS: ContractorProfile[] = [
  {
    id: "northstar-renovation-group",
    name: "Northstar Renovation Group",
    trades: ["General renovation", "Carpentry and built-ins"],
    categories: ["Labour", "Built-ins", "Flooring", "Paint"],
    servicePostalCodePrefixes: ["K", "L", "M"],
    serviceArea: "GTA, Golden Horseshoe, and eastern Ontario",
    rating: 4.8,
    reviewCount: 186,
    projectMinimum: 8500,
    typicalProjectRange: { low: 12000, typical: 24000, high: 65000 },
    leadTimeDays: 28,
    verification: {
      licenseStatus: "verified",
      insuranceStatus: "verified",
      checkedAt: "2026-04-01",
    },
    priceLevel: "standard",
    contactChannels: ["email", "phone"],
  },
  {
    id: "hearth-beam-remodels",
    name: "Hearth & Beam Remodels",
    trades: ["General renovation", "Flooring", "Painting"],
    categories: ["Labour", "Flooring", "Paint", "Electrical"],
    servicePostalCodePrefixes: ["L", "N"],
    serviceArea: "Golden Horseshoe and southwestern Ontario",
    rating: 4.7,
    reviewCount: 142,
    projectMinimum: 7000,
    typicalProjectRange: { low: 10000, typical: 22000, high: 52000 },
    leadTimeDays: 21,
    verification: {
      licenseStatus: "self-reported",
      insuranceStatus: "verified",
      checkedAt: "2026-03-18",
    },
    priceLevel: "standard",
    contactChannels: ["email"],
  },
  {
    id: "bright-circuit-electric",
    name: "Bright Circuit Electric",
    trades: ["Electrical and lighting"],
    categories: ["Electrical", "Lighting"],
    servicePostalCodePrefixes: ["K", "L", "M"],
    serviceArea: "GTA, Golden Horseshoe, and eastern Ontario",
    rating: 4.9,
    reviewCount: 274,
    projectMinimum: 1200,
    typicalProjectRange: { low: 1800, typical: 4200, high: 12000 },
    leadTimeDays: 14,
    verification: {
      licenseStatus: "verified",
      insuranceStatus: "verified",
      checkedAt: "2026-04-05",
    },
    priceLevel: "standard",
    contactChannels: ["email", "phone"],
  },
  {
    id: "panel-pendant-electric",
    name: "Panel & Pendant Electric",
    trades: ["Electrical and lighting"],
    categories: ["Electrical", "Lighting"],
    servicePostalCodePrefixes: ["L", "M", "N"],
    serviceArea: "GTA, Golden Horseshoe, and southwestern Ontario",
    rating: 4.6,
    reviewCount: 118,
    projectMinimum: 950,
    typicalProjectRange: { low: 1400, typical: 3600, high: 9000 },
    leadTimeDays: 10,
    verification: {
      licenseStatus: "verified",
      insuranceStatus: "self-reported",
      checkedAt: "2026-03-28",
    },
    priceLevel: "budget",
    contactChannels: ["email"],
  },
  {
    id: "copperline-plumbing",
    name: "Copperline Plumbing",
    trades: ["Plumbing"],
    categories: ["Plumbing"],
    servicePostalCodePrefixes: ["K", "L", "M"],
    serviceArea: "GTA, Golden Horseshoe, and eastern Ontario",
    rating: 4.8,
    reviewCount: 209,
    projectMinimum: 1100,
    typicalProjectRange: { low: 1600, typical: 4500, high: 13000 },
    leadTimeDays: 18,
    verification: {
      licenseStatus: "verified",
      insuranceStatus: "verified",
      checkedAt: "2026-04-02",
    },
    priceLevel: "standard",
    contactChannels: ["email", "phone"],
  },
  {
    id: "flowcheck-pros",
    name: "FlowCheck Pros",
    trades: ["Plumbing"],
    categories: ["Plumbing"],
    servicePostalCodePrefixes: ["L", "N", "P"],
    serviceArea: "Golden Horseshoe, southwestern Ontario, and northern Ontario",
    rating: 4.5,
    reviewCount: 96,
    projectMinimum: 900,
    typicalProjectRange: { low: 1200, typical: 3800, high: 9500 },
    leadTimeDays: 12,
    verification: {
      licenseStatus: "self-reported",
      insuranceStatus: "verified",
      checkedAt: "2026-03-22",
    },
    priceLevel: "budget",
    contactChannels: ["email"],
  },
  {
    id: "cornerstone-built-ins",
    name: "Cornerstone Built-Ins",
    trades: ["Carpentry and built-ins"],
    categories: ["Built-ins", "Furniture"],
    servicePostalCodePrefixes: ["K", "L", "M"],
    serviceArea: "GTA, Golden Horseshoe, and eastern Ontario",
    rating: 4.9,
    reviewCount: 167,
    projectMinimum: 2500,
    typicalProjectRange: { low: 3500, typical: 8500, high: 22000 },
    leadTimeDays: 35,
    verification: {
      licenseStatus: "verified",
      insuranceStatus: "verified",
      checkedAt: "2026-03-30",
    },
    priceLevel: "premium",
    contactChannels: ["email"],
  },
  {
    id: "truefit-millwork",
    name: "TrueFit Millwork",
    trades: ["Carpentry and built-ins"],
    categories: ["Built-ins", "Furniture"],
    servicePostalCodePrefixes: ["L", "N"],
    serviceArea: "Golden Horseshoe and southwestern Ontario",
    rating: 4.7,
    reviewCount: 132,
    projectMinimum: 1800,
    typicalProjectRange: { low: 2400, typical: 6800, high: 16000 },
    leadTimeDays: 24,
    verification: {
      licenseStatus: "self-reported",
      insuranceStatus: "verified",
      checkedAt: "2026-03-26",
    },
    priceLevel: "standard",
    contactChannels: ["email", "phone"],
  },
  {
    id: "level-line-floors",
    name: "Level Line Floors",
    trades: ["Flooring"],
    categories: ["Flooring"],
    servicePostalCodePrefixes: ["K", "L", "M", "N"],
    serviceArea: "Eastern, central, GTA, and southwestern Ontario",
    rating: 4.8,
    reviewCount: 221,
    projectMinimum: 1800,
    typicalProjectRange: { low: 2500, typical: 6200, high: 18000 },
    leadTimeDays: 16,
    verification: {
      licenseStatus: "verified",
      insuranceStatus: "verified",
      checkedAt: "2026-04-04",
    },
    priceLevel: "standard",
    contactChannels: ["email", "phone"],
  },
  {
    id: "surfacecraft-flooring",
    name: "SurfaceCraft Flooring",
    trades: ["Flooring"],
    categories: ["Flooring"],
    servicePostalCodePrefixes: ["L", "N", "P"],
    serviceArea: "Golden Horseshoe, southwestern, and northern Ontario routes",
    rating: 4.6,
    reviewCount: 103,
    projectMinimum: 1400,
    typicalProjectRange: { low: 2000, typical: 5400, high: 14000 },
    leadTimeDays: 9,
    verification: {
      licenseStatus: "self-reported",
      insuranceStatus: "verified",
      checkedAt: "2026-03-20",
    },
    priceLevel: "budget",
    contactChannels: ["email"],
  },
  {
    id: "finish-coat-studio",
    name: "Finish Coat Studio",
    trades: ["Painting"],
    categories: ["Paint"],
    servicePostalCodePrefixes: ["K", "L", "M", "N"],
    serviceArea: "Eastern, central, GTA, and southwestern Ontario",
    rating: 4.7,
    reviewCount: 188,
    projectMinimum: 900,
    typicalProjectRange: { low: 1200, typical: 3200, high: 8500 },
    leadTimeDays: 11,
    verification: {
      licenseStatus: "self-reported",
      insuranceStatus: "verified",
      checkedAt: "2026-03-25",
    },
    priceLevel: "standard",
    contactChannels: ["email", "phone"],
  },
  {
    id: "palette-pro-painters",
    name: "Palette Pro Painters",
    trades: ["Painting"],
    categories: ["Paint"],
    servicePostalCodePrefixes: ["L", "N"],
    serviceArea: "Golden Horseshoe and southwestern Ontario painting routes",
    rating: 4.5,
    reviewCount: 87,
    projectMinimum: 650,
    typicalProjectRange: { low: 900, typical: 2400, high: 6500 },
    leadTimeDays: 8,
    verification: {
      licenseStatus: "unverified",
      insuranceStatus: "self-reported",
      checkedAt: "2026-03-12",
    },
    priceLevel: "budget",
    contactChannels: ["email"],
  },
  {
    id: "roomwright-studio",
    name: "Roomwright Studio",
    trades: ["Interior styling"],
    categories: ["Furniture", "Paint", "Built-ins"],
    servicePostalCodePrefixes: ["K", "L", "M", "N", "P"],
    serviceArea: "Remote planning plus local styling partners",
    rating: 4.8,
    reviewCount: 153,
    projectMinimum: 750,
    typicalProjectRange: { low: 1200, typical: 4500, high: 15000 },
    leadTimeDays: 7,
    verification: {
      licenseStatus: "self-reported",
      insuranceStatus: "self-reported",
      checkedAt: "2026-03-29",
    },
    priceLevel: "standard",
    contactChannels: ["email"],
  },
];

function normalizePostalCode(postalCode: string): string {
  return postalCode.trim().replace(/\s+/g, "").toUpperCase();
}

function formatPostalCodeForDisplay(postalCode: string): string {
  const normalizedPostalCode = normalizePostalCode(postalCode);
  if (normalizedPostalCode.length <= 3) {
    return normalizedPostalCode;
  }

  return `${normalizedPostalCode.slice(0, 3)} ${normalizedPostalCode.slice(3)}`;
}

function serviceAreaMatches(profile: ContractorProfile, postalCode: string): boolean {
  const normalizedPostalCode = normalizePostalCode(postalCode);
  if (!normalizedPostalCode) {
    return false;
  }

  return profile.servicePostalCodePrefixes.some((prefix) => normalizedPostalCode.startsWith(prefix));
}

function categoriesOverlap(left: CostCategory[], right: CostCategory[]): CostCategory[] {
  return left.filter((category) => right.includes(category));
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

function roundToNearestFifty(value: number): number {
  return Math.round(value / 50) * 50;
}

function scaleRange(range: CostRange, multiplier: number): CostRange {
  return {
    low: roundToNearestFifty(range.low * multiplier),
    typical: roundToNearestFifty(range.typical * multiplier),
    high: roundToNearestFifty(range.high * multiplier),
  };
}

function rangeForCategories(lineItems: CostLineItem[], categories: CostCategory[], fallback: CostRange): CostRange {
  if (categories.includes("Labour")) {
    return fallback;
  }

  const matchedRanges = lineItems
    .filter((item) => categories.includes(item.category) && item.includedInFullRenovation)
    .map((item) => item.contractorRange);

  return matchedRanges.length ? sumRanges(matchedRanges) : fallback;
}

function categoriesFromTasks(tasks: string[]): Set<CostCategory> {
  const categories = new Set<CostCategory>();

  tasks.forEach((task) => {
    const normalizedTask = task.toLowerCase();

    TRADE_DEFINITIONS.forEach((trade) => {
      const hasKeyword = trade.taskKeywords.some((keyword) => normalizedTask.includes(keyword));
      if (!hasKeyword) {
        return;
      }

      trade.categories.forEach((category) => categories.add(category));
    });
  });

  return categories;
}

function taskMatchesTrade(task: string, trade: TradeDefinition): boolean {
  const normalizedTask = task.toLowerCase();
  return trade.taskKeywords.some((keyword) => normalizedTask.includes(keyword));
}

function getNeededTrades(input: ContractorMatchInput): TradeDefinition[] {
  const estimateCategories = new Set<CostCategory>(
    input.costEstimate.lineItems
      .filter((item) => item.includedInFullRenovation && item.category !== "Labour")
      .map((item) => item.category),
  );
  const taskCategories = categoriesFromTasks(input.analysis.contractorTasks);

  taskCategories.forEach((category) => estimateCategories.add(category));

  const hasComplexScope =
    estimateCategories.size >= 3 ||
    input.analysis.contractorTasks.length >= 2 ||
    input.goals.some((goal) => goal.toLowerCase().includes("layout")) ||
    ["basement", "kitchen", "laundry room"].includes(input.roomType.toLowerCase());

  if (hasComplexScope) {
    estimateCategories.add("Labour");
  }

  const trades = TRADE_DEFINITIONS.filter((trade) => trade.categories.some((category) => estimateCategories.has(category)));
  return trades.length ? trades : [TRADE_DEFINITIONS[TRADE_DEFINITIONS.length - 1]];
}

function budgetFit(profile: ContractorProfile, estimateRange: CostRange): { score: number; label: string } {
  if (estimateRange.high < profile.projectMinimum) {
    return {
      score: -10,
      label: `Likely below ${profile.name}'s ${formatCad(profile.projectMinimum)} minimum; ask about bundling scope.`,
    };
  }

  if (estimateRange.typical >= profile.typicalProjectRange.low && estimateRange.typical <= profile.typicalProjectRange.high) {
    return {
      score: 18,
      label: `Strong fit for this ${formatCadRange(estimateRange)} planning range.`,
    };
  }

  if (estimateRange.high < profile.typicalProjectRange.low) {
    return {
      score: 8,
      label: `Smaller than their usual jobs, but above the stated minimum.`,
    };
  }

  return {
    score: 12,
    label: `Scope may need a phased bid because it is above their typical project band.`,
  };
}

function availabilityLabel(leadTimeDays: number): string {
  if (leadTimeDays <= 14) {
    return "1-2 weeks";
  }

  if (leadTimeDays <= 28) {
    return "3-4 weeks";
  }

  if (leadTimeDays <= 42) {
    return "5-6 weeks";
  }

  return "6+ weeks";
}

function scoreContractor({
  profile,
  trade,
  postalCode,
  estimateRange,
}: {
  profile: ContractorProfile;
  trade: TradeDefinition;
  postalCode: string;
  estimateRange: CostRange;
}): ContractorMatch {
  const matchedCategories = categoriesOverlap(profile.categories, trade.categories);
  const hasServiceMatch = serviceAreaMatches(profile, postalCode);
  const fit = budgetFit(profile, estimateRange);
  const ratingScore = Math.max(0, Math.round((profile.rating - 4) * 10));
  const availabilityScore = profile.leadTimeDays <= 14 ? 10 : profile.leadTimeDays <= 28 ? 7 : profile.leadTimeDays <= 42 ? 4 : 1;
  const verificationScore =
    profile.verification.licenseStatus === "verified" && profile.verification.insuranceStatus === "verified" ? 10 : 5;
  const score =
    matchedCategories.length * 24 +
    (hasServiceMatch ? 18 : -8) +
    fit.score +
    ratingScore +
    availabilityScore +
    verificationScore;

  const reasons = [
    `${matchedCategories.join(", ")} scope matches ${profile.trades.join(" + ")} work.`,
    hasServiceMatch
      ? `Service area overlaps postal code ${formatPostalCodeForDisplay(postalCode)}.`
      : `Service area needs confirmation for postal code ${formatPostalCodeForDisplay(postalCode)}.`,
    fit.label,
    `${profile.rating.toFixed(1)} rating across ${profile.reviewCount} reviews.`,
    `${availabilityLabel(profile.leadTimeDays)} estimated availability window.`,
  ];

  return {
    id: profile.id,
    name: profile.name,
    trade: trade.trade,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    specialties: profile.trades,
    matchedCategories,
    fitScore: Math.min(99, Math.max(0, Math.round(score))),
    budgetFit: fit.label,
    projectMinimum: profile.projectMinimum,
    typicalProjectRange: scaleRange(estimateRange, profile.priceLevel === "premium" ? 1.18 : profile.priceLevel === "budget" ? 0.92 : 1),
    leadTimeWeeks: availabilityLabel(profile.leadTimeDays),
    serviceArea: profile.serviceArea,
    licenseSummary: `${profile.verification.licenseStatus} license, ${profile.verification.insuranceStatus} insurance; checked ${profile.verification.checkedAt}`,
    reasons,
    recommendedScope: `${trade.trade}: ${matchedCategories.join(", ")} work tied to the current estimate.`,
    nextStep: "Send the scope brief, confirm site availability, and request a line-item quote against the planning range.",
  };
}

export function buildContractorMatchGroups(input: ContractorMatchInput): ContractorMatchGroup[] {
  const normalizedPostalCode = normalizePostalCode(input.postalCode);
  if (normalizedPostalCode.length < 3) {
    return [];
  }

  return getNeededTrades(input).map((trade) => {
    const estimateRange = rangeForCategories(input.costEstimate.lineItems, trade.categories, input.costEstimate.fullRenovationRange);
    const tasks = input.analysis.contractorTasks.filter((task) => taskMatchesTrade(task, trade));
    const matches = MOCK_CONTRACTORS.filter((profile) => categoriesOverlap(profile.categories, trade.categories).length > 0)
      .map((profile) => scoreContractor({ profile, trade, postalCode: normalizedPostalCode, estimateRange }))
      .sort((left, right) => right.fitScore - left.fitScore)
      .slice(0, 3);

    return {
      trade: trade.trade,
      categories: trade.categories,
      estimateRange,
      tasks,
      matches,
    };
  });
}

export function buildContractorOutreachBrief({
  analysis,
  costEstimate,
  goals,
  roomType,
  style,
  postalCode,
  group,
  match,
}: ContractorMatchInput & {
  group: ContractorMatchGroup;
  match: ContractorMatch;
}): string {
  const matchedItems = costEstimate.lineItems
    .filter((item) => group.categories.includes(item.category) && item.includedInFullRenovation)
    .map((item) => `- ${item.category}: ${formatCadRange(item.contractorRange)} (${item.scopeNote})`);

  return [
    `Project: ${roomType} renovation in ${style} style`,
    `Postal code: ${formatPostalCodeForDisplay(postalCode)}`,
    `Contractor: ${match.name}`,
    `Trade: ${group.trade}`,
    "",
    "Room summary:",
    analysis.roomSummary,
    "",
    `Goals: ${goals.join(", ")}`,
    `Planning range for this trade: ${formatCadRange(group.estimateRange)}`,
    "",
    "Estimate lines:",
    matchedItems.length ? matchedItems.join("\n") : `- ${group.trade}: ${formatCadRange(group.estimateRange)}`,
    "",
    "Contractor-owned tasks:",
    group.tasks.length ? group.tasks.map((task) => `- ${task}`).join("\n") : analysis.contractorTasks.map((task) => `- ${task}`).join("\n"),
    "",
    "Preferred materials / finishes:",
    analysis.materials.map((material) => `- ${material}`).join("\n"),
    "",
    "Please quote:",
    "- Line-item pricing by labor, material allowances, and exclusions",
    "- Earliest site visit and estimated start window",
    "- Permit, license, and insurance requirements",
    "- Any scope gaps or owner decisions needed before a fixed bid",
  ].join("\n");
}
