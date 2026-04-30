export type RenovationSuggestion = {
  title: string;
  why: string;
  estimatedCost: string;
  difficulty: "easy" | "medium" | "hard";
};

export type RoomAnalysis = {
  roomSummary: string;
  priorities: string[];
  suggestions: RenovationSuggestion[];
  budget: {
    low: string;
    medium: string;
    high: string;
  };
  materials: string[];
  contractorTasks: string[];
  diyTasks: string[];
  imagePrompt: string;
};

export type CostCategory = "Flooring" | "Paint" | "Lighting" | "Built-ins" | "Plumbing" | "Electrical" | "Furniture" | "Labour";

export type CostRange = {
  low: number;
  typical: number;
  high: number;
};

export type EstimateUnit = "sqft" | "linear_ft" | "each" | "hour" | "allowance";

export type EstimateConfidence = "low" | "medium" | "high";

export type EstimateQualityTier = "budget" | "standard" | "premium";

export type HomeAgeBand = "pre_1960" | "1960_1990" | "1990_2010" | "2010_plus";

export type ScopeComplexity = "cosmetic" | "moderate" | "major";

export type QuantitySource = "user" | "room_default" | "scope_default" | "catalog_allowance";

export type PostalRegion = {
  postalCode: string;
  fsa: string;
  province: "ON" | "unknown";
  regionName: string;
  pricingRegion: "Toronto" | "Ottawa" | "Central Ontario" | "Southwestern Ontario" | "Northern Ontario" | "Ontario";
  cma?: "Toronto" | "Ottawa" | "London";
  isOntario: boolean;
  regionalMultiplier: number;
  sourceSummary: string;
};

export type CostLineItem = {
  category: CostCategory;
  diyCost: number;
  contractorCost: number;
  diyRange: CostRange;
  contractorRange: CostRange;
  includedInDiyRefresh: boolean;
  includedInFullRenovation: boolean;
  scopeNote: string;
  contractorSpecialty: string;
  catalogItemId: string;
  label: string;
  unit: EstimateUnit;
  quantity: number;
  quantityLabel: string;
  quantitySource: QuantitySource;
  unitCostRange: CostRange;
  regionalMultiplier: number;
  calibrationMultiplier: number;
  calibrationSource: string;
  calibrationReferencePeriod: string;
  qualityTierFactor: number;
  complexityFactor: number;
  homeAgeFactor: number;
  sourceSummary: string[];
  confidence: EstimateConfidence;
};

export type CostEstimate = {
  lineItems: CostLineItem[];
  diyRefreshTotal: number;
  fullRenovationTotal: number;
  diyRefreshRange: CostRange;
  fullRenovationRange: CostRange;
  contingencyPercent: number;
  confidence: "directional" | "planning" | "bid-ready";
  assumptions: string[];
  exclusions: string[];
  sourceSummary: string[];
  region: PostalRegion;
  inputs: {
    postalCode: string;
    roomAreaSqft: number;
    roomAreaSource: QuantitySource;
    qualityTier: EstimateQualityTier;
    homeAgeBand: HomeAgeBand;
    scopeComplexity: ScopeComplexity;
  };
};

export type ContractorMatch = {
  id: string;
  name: string;
  trade: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  matchedCategories: CostCategory[];
  fitScore: number;
  budgetFit: string;
  projectMinimum: number;
  typicalProjectRange: CostRange;
  leadTimeWeeks: string;
  serviceArea: string;
  licenseSummary: string;
  reasons: string[];
  recommendedScope: string;
  nextStep: string;
};

export type ContractorProfile = {
  id: string;
  name: string;
  trades: string[];
  categories: CostCategory[];
  servicePostalCodePrefixes: string[];
  serviceArea: string;
  rating: number;
  reviewCount: number;
  projectMinimum: number;
  typicalProjectRange: CostRange;
  leadTimeDays: number;
  verification: {
    licenseStatus: "verified" | "self-reported" | "unverified";
    insuranceStatus: "verified" | "self-reported" | "unverified";
    checkedAt: string;
  };
  priceLevel: "budget" | "standard" | "premium";
  contactChannels: string[];
};

export type ContractorMatchGroup = {
  trade: string;
  categories: CostCategory[];
  estimateRange: CostRange;
  tasks: string[];
  matches: ContractorMatch[];
};

export type AnalyzeRoomInput = {
  roomType: string;
  style: string;
  goals: string[];
  imageDataUrl?: string;
};
