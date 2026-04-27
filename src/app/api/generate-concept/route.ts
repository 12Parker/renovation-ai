import { NextResponse } from "next/server";

type GenerateConceptInput = {
  prompt: string;
  imageDataUrl?: string;
};

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
};

function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) {
    return null;
  }

  const [, mimeType, base64Data] = matches;
  return { mimeType, base64Data };
}

function buildEditPrompt(userPrompt: string): string {
  return [
    "Use the uploaded image as the primary reference.",
    "Preserve the original room layout, camera perspective, and structural elements.",
    "Apply only realistic renovation changes requested below.",
    userPrompt.trim(),
  ].join("\n");
}

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateConceptInput;

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required to generate a concept image." }, { status: 400 });
  }

  if (!body.imageDataUrl) {
    return NextResponse.json({ error: "Uploaded source image is required." }, { status: 400 });
  }

  const parsed = parseDataUrl(body.imageDataUrl);
  if (!parsed) {
    return NextResponse.json({ error: "Image must be a base64 data URL." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is missing. Add it to your environment to run image generation." }, { status: 500 });
  }

  try {
    const binary = Buffer.from(parsed.base64Data, "base64");
    const imageBlob = new Blob([binary], { type: parsed.mimeType });

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", buildEditPrompt(body.prompt));
    formData.append("size", "1024x1024");
    formData.append("image", imageBlob, "room-upload.png");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `OpenAI image request failed: ${errorText}` }, { status: 502 });
    }

    const result = (await response.json()) as OpenAIImageResponse;
    const generatedBase64 = result.data?.[0]?.b64_json;

    if (!generatedBase64) {
      return NextResponse.json({ error: "OpenAI returned no image data." }, { status: 502 });
    }

    return NextResponse.json({ imageDataUrl: `data:image/png;base64,${generatedBase64}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
