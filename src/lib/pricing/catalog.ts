import type { CostCategory, CostRange, EstimateConfidence, EstimateUnit } from "@/lib/models/room-analysis";

export type PricingCatalogItem = {
  id: string;
  category: CostCategory;
  label: string;
  unit: EstimateUnit;
  contractorUnitCost: CostRange;
  diyUnitCost: CostRange;
  scopeNote: string;
  contractorSpecialty: string;
  sourceSummary: string[];
  baseRegion: string;
  baseQuarter: string;
  confidence: EstimateConfidence;
};

export const PRICING_CATALOG: PricingCatalogItem[] = [
  {
    id: "flooring-lvp-installed",
    category: "Flooring",
    label: "Installed resilient or engineered flooring allowance",
    unit: "sqft",
    contractorUnitCost: { low: 9, typical: 13, high: 21 },
    diyUnitCost: { low: 3, typical: 5, high: 9 },
    scopeNote: "Finish material, underlayment, transitions, and normal subfloor prep.",
    contractorSpecialty: "Flooring installer",
    sourceSummary: [
      "Curated Ontario 2026 planning catalog for installed flooring.",
      "StatsCan RRPI flooring project group should be used for quarterly escalation in the next data update.",
    ],
    baseRegion: "Ontario",
    baseQuarter: "2026-Q1",
    confidence: "medium",
  },
  {
    id: "paint-walls-trim",
    category: "Paint",
    label: "Wall, ceiling, and trim paint allowance",
    unit: "sqft",
    contractorUnitCost: { low: 2, typical: 3.5, high: 6 },
    diyUnitCost: { low: 0.7, typical: 1.1, high: 2 },
    scopeNote: "Paintable surface area, minor patching, primer, paint, and standard trim touch-ups.",
    contractorSpecialty: "Painter",
    sourceSummary: [
      "Curated Ontario 2026 planning catalog for paintable surface area.",
      "Paint has weaker direct RRPI coverage, so contractor quotes should calibrate this category early.",
    ],
    baseRegion: "Ontario",
    baseQuarter: "2026-Q1",
    confidence: "medium",
  },
  {
    id: "lighting-fixture-installed",
    category: "Lighting",
    label: "Installed fixture or recessed light allowance",
    unit: "each",
    contractorUnitCost: { low: 275, typical: 475, high: 850 },
    diyUnitCost: { low: 60, typical: 140, high: 260 },
    scopeNote: "Fixture, trim kit, dimmer allowance, and straightforward installation.",
    contractorSpecialty: "Lighting electrician",
    sourceSummary: [
      "Curated Ontario 2026 planning catalog for lighting fixtures.",
      "Electrical-heavy lighting projects need contractor quote calibration because fixture access and circuits vary widely.",
    ],
    baseRegion: "Ontario",
    baseQuarter: "2026-Q1",
    confidence: "medium",
  },
  {
    id: "built-ins-finish-carpentry",
    category: "Built-ins",
    label: "Built-in storage or finish carpentry allowance",
    unit: "linear_ft",
    contractorUnitCost: { low: 650, typical: 1100, high: 1850 },
    diyUnitCost: { low: 140, typical: 320, high: 620 },
    scopeNote: "Semi-custom storage, shelving, cabinetry, and finish carpentry.",
    contractorSpecialty: "Finish carpenter",
    sourceSummary: [
      "Curated Ontario 2026 planning catalog for semi-custom built-ins.",
      "Premium custom millwork should be treated as a quote-required upgrade.",
    ],
    baseRegion: "Ontario",
    baseQuarter: "2026-Q1",
    confidence: "low",
  },
  {
    id: "plumbing-fixture-installed",
    category: "Plumbing",
    label: "Plumbing fixture or rough-in allowance",
    unit: "each",
    contractorUnitCost: { low: 900, typical: 2300, high: 5200 },
    diyUnitCost: { low: 120, typical: 300, high: 700 },
    scopeNote: "Fixture swaps or limited rough-in allowance; major relocations need bids.",
    contractorSpecialty: "Licensed plumber",
    sourceSummary: [
      "Curated Ontario 2026 planning catalog for common fixture/rough-in scopes.",
      "StatsCan RRPI plumbing fixtures group should be used for quarterly escalation in the next data update.",
    ],
    baseRegion: "Ontario",
    baseQuarter: "2026-Q1",
    confidence: "low",
  },
  {
    id: "electrical-device-circuit",
    category: "Electrical",
    label: "Electrical device, circuit, or code allowance",
    unit: "each",
    contractorUnitCost: { low: 325, typical: 725, high: 1600 },
    diyUnitCost: { low: 45, typical: 95, high: 180 },
    scopeNote: "Outlet, switch, circuit, dimmer, and code-sensitive electrical allowances.",
    contractorSpecialty: "Licensed electrician",
    sourceSummary: [
      "Curated Ontario 2026 planning catalog for electrical device/circuit allowances.",
      "Panel upgrades, aluminum wiring, and ESA requirements should be quoted directly.",
    ],
    baseRegion: "Ontario",
    baseQuarter: "2026-Q1",
    confidence: "low",
  },
  {
    id: "furniture-styling-allowance",
    category: "Furniture",
    label: "Furniture, assembly, and styling allowance",
    unit: "allowance",
    contractorUnitCost: { low: 1500, typical: 3200, high: 7800 },
    diyUnitCost: { low: 900, typical: 2200, high: 5200 },
    scopeNote: "Core furnishings, assembly, delivery, and styling allowances.",
    contractorSpecialty: "Interior stylist",
    sourceSummary: [
      "Curated Ontario 2026 planning allowance for furniture and styling.",
      "This is a purchasing allowance, not a contractor bid substitute.",
    ],
    baseRegion: "Ontario",
    baseQuarter: "2026-Q1",
    confidence: "low",
  },
  {
    id: "general-renovation-labour",
    category: "Labour",
    label: "General renovation labour and coordination",
    unit: "sqft",
    contractorUnitCost: { low: 10, typical: 19, high: 36 },
    diyUnitCost: { low: 1, typical: 3, high: 8 },
    scopeNote: "General project labour, site protection, coordination, cleanup, and punch-list time.",
    contractorSpecialty: "General contractor",
    sourceSummary: [
      "Curated Ontario 2026 planning catalog for general renovation coordination.",
      "StatsCan RRPI interior remodel and basement finishing projects should calibrate this over time.",
    ],
    baseRegion: "Ontario",
    baseQuarter: "2026-Q1",
    confidence: "low",
  },
];

export function getCatalogItem(category: CostCategory): PricingCatalogItem {
  const item = PRICING_CATALOG.find((candidate) => candidate.category === category);
  if (!item) {
    throw new Error(`Missing pricing catalog item for ${category}`);
  }

  return item;
}
