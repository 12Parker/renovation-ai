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

export type AnalyzeRoomInput = {
  roomType: string;
  style: string;
  goals: string[];
  imageDataUrl?: string;
};
