import { NextResponse } from "next/server";

import { buildRoomAnalysisPrompt } from "@/lib/ai/prompts";
import { isRoomAnalysis } from "@/lib/ai/validation";
import type { AnalyzeRoomInput, RoomAnalysis } from "@/lib/models/room-analysis";

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const RESPONSE_JSON_SCHEMA = {
  name: "room_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["roomSummary", "priorities", "suggestions", "budget", "materials", "contractorTasks", "diyTasks", "imagePrompt"],
    properties: {
      roomSummary: { type: "string" },
      priorities: {
        type: "array",
        items: { type: "string" },
      },
      suggestions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "why", "estimatedCost", "difficulty"],
          properties: {
            title: { type: "string" },
            why: { type: "string" },
            estimatedCost: { type: "string" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          },
        },
      },
      budget: {
        type: "object",
        additionalProperties: false,
        required: ["low", "medium", "high"],
        properties: {
          low: { type: "string" },
          medium: { type: "string" },
          high: { type: "string" },
        },
      },
      materials: {
        type: "array",
        items: { type: "string" },
      },
      contractorTasks: {
        type: "array",
        items: { type: "string" },
      },
      diyTasks: {
        type: "array",
        items: { type: "string" },
      },
      imagePrompt: { type: "string" },
    },
  },
};

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyzeRoomInput;

  if (!body.imageDataUrl) {
    return NextResponse.json({ error: "Please upload an image before analysis." }, { status: 400 });
  }

  if (!body.goals?.length) {
    return NextResponse.json({ error: "Please select at least one renovation goal." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is missing. Add it to your environment to run milestone 3." }, { status: 500 });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const prompt = buildRoomAnalysisPrompt(body);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: {
          type: "json_schema",
          json_schema: RESPONSE_JSON_SCHEMA,
        },
        messages: [
          {
            role: "system",
            content: "You output JSON only and follow the schema exactly.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: body.imageDataUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenAI request failed: ${errorText}` }, { status: 502 });
    }

    const result = (await response.json()) as OpenAIChatCompletionResponse;
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "OpenAI returned an empty response." }, { status: 502 });
    }

    const parsed = JSON.parse(content) as RoomAnalysis;

    if (!isRoomAnalysis(parsed)) {
      return NextResponse.json({ error: "Model response did not match RoomAnalysis schema." }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
