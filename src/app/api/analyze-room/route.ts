import { NextResponse } from "next/server";

import type { RoomAnalysis } from "@/lib/models/room-analysis";

type AnalyzeRoomRequest = {
  roomType?: string;
  style?: string;
  goals?: string[];
  imageDataUrl?: string;
};

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
    {
      title: "Define the seating zone",
      why: "Anchor the room with a rug and sectional to improve flow and comfort.",
      estimatedCost: "$1,000-$2,500",
      difficulty: "easy",
    },
  ],
  budget: {
    low: "$2,000-$6,000",
    medium: "$8,000-$18,000",
    high: "$20,000-$45,000",
  },
  materials: ["Luxury vinyl plank flooring", "Warm LED recessed lights", "Acoustic wall panels", "Moisture-resistant paint"],
  contractorTasks: ["New recessed lighting circuit", "Inspect and update basement electrical outlets"],
  diyTasks: ["Paint walls", "Install shelving", "Assemble seating and decor"],
  imagePrompt:
    "Transform this unfinished basement into a cozy modern theatre room with warm recessed lighting, luxury vinyl plank flooring, acoustic wall panels, a sectional sofa, and soft neutral colors.",
};

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRoomRequest;

  if (!body.imageDataUrl) {
    return NextResponse.json({ error: "Please upload an image before analysis." }, { status: 400 });
  }

  return NextResponse.json({
    ...mockResponse,
    priorities: body.goals?.length ? body.goals : mockResponse.priorities,
    roomSummary: body.roomType
      ? `Sample ${body.roomType} analysis in ${body.style ?? "selected"} style. ${mockResponse.roomSummary}`
      : mockResponse.roomSummary,
  });
}
