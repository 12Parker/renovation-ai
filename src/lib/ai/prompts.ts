import type { AnalyzeRoomInput } from "@/lib/models/room-analysis";

export function buildRoomAnalysisPrompt(input: AnalyzeRoomInput): string {
  return `You are a renovation planning assistant.\n\nRoom type: ${input.roomType}\nTarget style: ${input.style}\nGoals: ${input.goals.join(", ")}\n\nReturn valid JSON matching the schema provided by the developer.`;
}
