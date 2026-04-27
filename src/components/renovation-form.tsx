"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, Copy, Loader2, RefreshCw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBeforeAfterPrompt } from "@/lib/ai/prompts";
import type { RoomAnalysis } from "@/lib/models/room-analysis";

const ROOM_TYPES = ["basement", "bedroom", "kitchen", "laundry room", "office", "living room"] as const;
const STYLES = ["cozy modern", "vintage", "Tudor", "Scandinavian", "moody", "minimalist"] as const;
const GOALS = ["better lighting", "flooring", "storage", "layout", "paint", "built-ins"] as const;

export function RenovationForm() {
  const [roomType, setRoomType] = useState(ROOM_TYPES[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [promptVariant, setPromptVariant] = useState(0);
  const [promptDraft, setPromptDraft] = useState("");
  const [didCopyPrompt, setDidCopyPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canAnalyze = useMemo(() => Boolean(imageDataUrl) && selectedGoals.length > 0 && !isAnalyzing, [imageDataUrl, selectedGoals, isAnalyzing]);

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal]));
  }

  function handleUpload(file: File | null) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(typeof reader.result === "string" ? reader.result : null);
      setAnalysis(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!canAnalyze || !imageDataUrl) {
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analyze-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomType,
          style,
          goals: selectedGoals,
          imageDataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to analyze this image right now.");
      }

      const result = (await response.json()) as RoomAnalysis;
      setAnalysis(result);
      setPromptVariant(0);
      setPromptDraft(result.imagePrompt);
      setDidCopyPrompt(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleRegeneratePrompt() {
    const nextVariant = promptVariant + 1;
    setPromptVariant(nextVariant);

    const highlights = analysis
      ? [...analysis.materials.slice(0, 3), ...analysis.suggestions.slice(0, 2).map((item) => item.title)]
      : [];

    const generated = buildBeforeAfterPrompt(
      {
        roomType,
        style,
        goals: selectedGoals,
        highlights,
      },
      nextVariant,
    );

    setPromptDraft(generated);
    setDidCopyPrompt(false);
  }

  async function handleCopyPrompt() {
    if (!promptDraft) {
      return;
    }

    await navigator.clipboard.writeText(promptDraft);
    setDidCopyPrompt(true);
    setTimeout(() => setDidCopyPrompt(false), 1500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Plan your renovation</CardTitle>
          <CardDescription>Upload a room photo, pick your style, and define your goals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
            {imageDataUrl ? (
              <div className="relative h-40 w-full overflow-hidden rounded-md border">
                <Image src={imageDataUrl} alt="Uploaded room" fill className="object-cover" />
              </div>
            ) : (
              <>
                <Upload className="h-7 w-7 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload room image (JPG/PNG)</span>
              </>
            )}
            <input className="hidden" type="file" accept="image/png, image/jpeg" onChange={(event) => handleUpload(event.target.files?.[0] ?? null)} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Room type
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={roomType} onChange={(event) => setRoomType(event.target.value)}>
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Style
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={style} onChange={(event) => setStyle(event.target.value)}>
                {STYLES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Goals</legend>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((goal) => (
                <label key={goal} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <input type="checkbox" checked={selectedGoals.includes(goal)} onChange={() => toggleGoal(goal)} />
                  <span>{goal}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button className="w-full" disabled={!canAnalyze} onClick={handleAnalyze}>
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isAnalyzing ? "Analyzing..." : "Analyze room"}
          </Button>
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results panel</CardTitle>
          <CardDescription>Real AI analysis for your uploaded room photo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analysis ? (
            <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
              Upload an image and select at least one goal to generate renovation output.
            </div>
          ) : (
            <>
              <section>
                <h3 className="font-semibold">What I noticed</h3>
                <p className="mt-1 text-sm text-muted-foreground">{analysis.roomSummary}</p>
              </section>

              <section>
                <h3 className="font-semibold">Biggest wins</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {analysis.suggestions.map((suggestion) => (
                    <li key={suggestion.title} className="rounded-md border p-3">
                      <p className="font-medium">{suggestion.title}</p>
                      <p className="text-muted-foreground">{suggestion.why}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {suggestion.estimatedCost} · {suggestion.difficulty}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold">Budget options</h3>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border p-2">
                    <p className="font-medium">Low</p>
                    <p>{analysis.budget.low}</p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="font-medium">Medium</p>
                    <p>{analysis.budget.medium}</p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="font-medium">High</p>
                    <p>{analysis.budget.high}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold">DIY weekend upgrades</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {analysis.diyTasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold">Contractor-level upgrades</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {analysis.contractorTasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-semibold">Image prompt</h3>
                <p className="mt-1 text-sm text-muted-foreground">Use this before/after prompt with image-generation tools, then copy or regenerate options.</p>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border bg-muted/30 p-3 text-sm"
                  value={promptDraft}
                  onChange={(event) => setPromptDraft(event.target.value)}
                />
                <p className="mt-2 text-xs text-muted-foreground">Suggested materials: {analysis.materials.join(" • ")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={handleRegeneratePrompt}>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate prompt
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCopyPrompt}>
                    {didCopyPrompt ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {didCopyPrompt ? "Copied" : "Copy prompt"}
                  </Button>
                </div>
              </section>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
