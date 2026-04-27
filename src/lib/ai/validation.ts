import type { RoomAnalysis } from "@/lib/models/room-analysis";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isRoomAnalysis(value: unknown): value is RoomAnalysis {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RoomAnalysis>;

  if (typeof candidate.roomSummary !== "string") {
    return false;
  }

  if (!isStringArray(candidate.priorities) || !isStringArray(candidate.materials) || !isStringArray(candidate.contractorTasks) || !isStringArray(candidate.diyTasks)) {
    return false;
  }

  if (!candidate.budget || typeof candidate.budget !== "object") {
    return false;
  }

  if (
    typeof candidate.budget.low !== "string" ||
    typeof candidate.budget.medium !== "string" ||
    typeof candidate.budget.high !== "string"
  ) {
    return false;
  }

  if (!Array.isArray(candidate.suggestions)) {
    return false;
  }

  if (
    !candidate.suggestions.every(
      (suggestion) =>
        suggestion &&
        typeof suggestion === "object" &&
        typeof suggestion.title === "string" &&
        typeof suggestion.why === "string" &&
        typeof suggestion.estimatedCost === "string" &&
        ["easy", "medium", "hard"].includes(String(suggestion.difficulty)),
    )
  ) {
    return false;
  }

  return typeof candidate.imagePrompt === "string";
}
