import type { AnalyzeRoomInput } from "@/lib/models/room-analysis";

export function buildRoomAnalysisPrompt(input: AnalyzeRoomInput): string {
  return [
    "You are an expert renovation planner.",
    "Analyze the room photo and user goals. Return practical, safety-aware guidance.",
    "Any electrical, plumbing, structural, or code-sensitive work must be listed in contractorTasks.",
    "Use concise language and realistic budgets in CAD ranges for Ontario, Canada.",
    "imagePrompt must be a single sentence suitable for downstream image generation.",
    "",
    `Room type: ${input.roomType}`,
    `Target style: ${input.style}`,
    `Goals: ${input.goals.join(", ")}`,
  ].join("\n");
}

type BeforeAfterPromptInput = {
  roomType: string;
  style: string;
  goals: string[];
  highlights?: string[];
};

const BEFORE_AFTER_TEMPLATES = [
  (input: BeforeAfterPromptInput, upgrades: string) =>
    `Using the uploaded room photo as a strict reference for layout and camera angle, transform this ${input.roomType} into a ${input.style} space focused on ${input.goals.join(", ")}, featuring ${upgrades}.`,
  (input: BeforeAfterPromptInput, upgrades: string) =>
    `Using the uploaded room photo as a reference image, redesign this ${input.roomType} as a ${input.style} interior with improvements for ${input.goals.join(", ")}, including ${upgrades}, while keeping the same perspective.`,
  (input: BeforeAfterPromptInput, upgrades: string) =>
    `Create a before-and-after concept for this ${input.roomType} by editing the uploaded photo: a ${input.style} remodel that prioritizes ${input.goals.join(", ")} with ${upgrades}, preserving room geometry and major structures.`,
];

export function buildBeforeAfterPrompt(input: BeforeAfterPromptInput, variant = 0): string {
  const highlights = input.highlights?.filter(Boolean) ?? [];
  const upgrades = highlights.length > 0 ? highlights.join(", ") : "better lighting, thoughtful storage, and cohesive finishes";
  const selectedTemplate = BEFORE_AFTER_TEMPLATES[Math.abs(variant) % BEFORE_AFTER_TEMPLATES.length];

  return selectedTemplate(input, upgrades);
}
