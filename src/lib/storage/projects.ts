import type { CostEstimate, EstimateQualityTier, HomeAgeBand, RoomAnalysis, ScopeComplexity } from "@/lib/models/room-analysis";

const PROJECTS_KEY = "renovation-ai:projects";

export type SavedProject = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  roomType: string;
  style: string;
  goals: string[];
  postalCode?: string;
  estimateRoomAreaSqft?: number;
  estimateQualityTier?: EstimateQualityTier;
  estimateHomeAgeBand?: HomeAgeBand;
  estimateScopeComplexity?: ScopeComplexity;
  shortlistedContractorIds?: string[];
  imageDataUrl?: string;
  generatedImageDataUrl?: string;
  analysis: RoomAnalysis;
  costEstimate: CostEstimate;
};

export function getSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(PROJECTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SavedProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertSavedProject(project: SavedProject): SavedProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  const existing = getSavedProjects();
  const deduped = [project, ...existing.filter((item) => item.id !== project.id)];
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(deduped));
  return deduped;
}

export function deleteSavedProject(projectId: string): SavedProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  const next = getSavedProjects().filter((item) => item.id !== projectId);
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
  return next;
}
