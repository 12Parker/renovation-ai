import type { CostRange } from "@/lib/models/room-analysis";
import { buildLocationAwareCostEstimate, type CostEstimateInput } from "@/lib/pricing/estimate-engine";

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

export function buildCostEstimate(input: CostEstimateInput) {
  return buildLocationAwareCostEstimate(input);
}
