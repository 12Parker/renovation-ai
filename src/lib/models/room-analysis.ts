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
