import { NextResponse } from "next/server";

import type { RoomAnalysis } from "@/lib/models/room-analysis";

const mockResponse: RoomAnalysis = {
  roomSummary: "Unfinished basement with limited natural light and strong potential for a cozy media zone.",
  priorities: ["lighting", "flooring", "layout"],
  suggestions: [
    {
      title: "Layered lighting",
      why: "Replace single-point lighting with recessed LEDs and warm ambient fixtures.",
      estimatedCost: "$1,500-$3,000",
      difficulty: "medium",
    },
  ],
  budget: {
    low: "$2,000-$6,000",
    medium: "$8,000-$18,000",
    high: "$20,000-$45,000",
  },
  materials: ["Luxury vinyl plank flooring", "Warm LED recessed lights", "Acoustic wall panels"],
  contractorTasks: ["New recessed lighting circuit"],
  diyTasks: ["Paint walls", "Install shelving"],
  imagePrompt:
    "Transform this unfinished basement into a cozy modern theatre room with warm recessed lighting and soft neutral colors.",
};

export async function POST() {
  return NextResponse.json(mockResponse);
}
