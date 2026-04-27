import type { AnalyzeRoomInput } from "@/lib/models/room-analysis";

export function buildRoomAnalysisPrompt(input: AnalyzeRoomInput): string {
  return [
    "You are an expert renovation planner.",
    "Analyze the room photo and user goals. Return practical, safety-aware guidance.",
    "Any electrical, plumbing, structural, or code-sensitive work must be listed in contractorTasks.",
    "Use concise language and realistic budgets in USD ranges.",
    "imagePrompt must be a single sentence suitable for downstream image generation.",
    "",
    `Room type: ${input.roomType}`,
    `Target style: ${input.style}`,
    `Goals: ${input.goals.join(", ")}`,
  ].join("\n");
}
