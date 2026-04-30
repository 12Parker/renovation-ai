"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBeforeAfterPrompt } from "@/lib/ai/prompts";
import { buildContractorMatchGroups, buildContractorOutreachBrief } from "@/lib/contractor-matching";
import { buildCostEstimate, formatCad, formatCadRange } from "@/lib/cost-estimator";
import type { ContractorMatch, ContractorMatchGroup, CostEstimate, RoomAnalysis } from "@/lib/models/room-analysis";
import { deleteSavedProject, getSavedProjects, upsertSavedProject, type SavedProject } from "@/lib/storage/projects";

const ROOM_TYPES = ["basement", "bedroom", "kitchen", "laundry room", "office", "living room"] as const;
const STYLES = ["cozy modern", "vintage", "Tudor", "Scandinavian", "moody", "minimalist"] as const;
const GOALS = ["better lighting", "flooring", "storage", "layout", "paint", "built-ins"] as const;
const CUSTOM_OPTION = "__custom__";

function contractorSelectionKey(group: ContractorMatchGroup, contractor: ContractorMatch): string {
  return `${group.trade}:${contractor.id}`;
}

function normalizePostalCodeInput(value: string): string {
  return value.toUpperCase();
}

function getSavedPostalCode(project: SavedProject): string {
  return project.postalCode ?? (project as SavedProject & { zipCode?: string }).zipCode ?? "";
}

export function RenovationForm() {
  const [roomType, setRoomType] = useState<string>(ROOM_TYPES[0]);
  const [style, setStyle] = useState<string>(STYLES[0]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customRoomType, setCustomRoomType] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [isCustomRoomType, setIsCustomRoomType] = useState(false);
  const [isCustomStyle, setIsCustomStyle] = useState(false);
  const [customGoalDraft, setCustomGoalDraft] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [promptVariant, setPromptVariant] = useState(0);
  const [promptDraft, setPromptDraft] = useState("");
  const [didCopyPrompt, setDidCopyPrompt] = useState(false);
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [generatedConceptImage, setGeneratedConceptImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [projectPostalCode, setProjectPostalCode] = useState("");
  const [shortlistedContractorIds, setShortlistedContractorIds] = useState<string[]>([]);
  const [copiedContractorId, setCopiedContractorId] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const effectiveRoomType = useMemo(() => customRoomType.trim() || roomType, [customRoomType, roomType]);
  const effectiveStyle = useMemo(() => customStyle.trim() || style, [customStyle, style]);
  const canAnalyze = useMemo(
    () => Boolean(imageDataUrl) && selectedGoals.length > 0 && Boolean(effectiveRoomType) && Boolean(effectiveStyle) && !isAnalyzing,
    [effectiveRoomType, effectiveStyle, imageDataUrl, selectedGoals, isAnalyzing],
  );
  const costEstimate: CostEstimate | null = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return buildCostEstimate({
      goals: selectedGoals,
      roomType: effectiveRoomType,
      style: effectiveStyle,
    });
  }, [analysis, effectiveRoomType, selectedGoals, effectiveStyle]);
  const contractorMatchGroups = useMemo(() => {
    if (!analysis || !costEstimate) {
      return [];
    }

    return buildContractorMatchGroups({
      analysis,
      costEstimate,
      goals: selectedGoals,
      roomType: effectiveRoomType,
      style: effectiveStyle,
      postalCode: projectPostalCode,
    });
  }, [analysis, costEstimate, effectiveRoomType, effectiveStyle, projectPostalCode, selectedGoals]);

  useEffect(() => {
    setSavedProjects(getSavedProjects());
  }, []);

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal]));
  }

  function handleAddCustomGoal() {
    const normalizedGoal = customGoalDraft.trim();
    if (!normalizedGoal) {
      return;
    }

    setSelectedGoals((prev) => (prev.includes(normalizedGoal) ? prev : [...prev, normalizedGoal]));
    setCustomGoalDraft("");
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
      setStatusMessage(null);
      setGeneratedConceptImage(null);
      setShortlistedContractorIds([]);
      setCopiedContractorId(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!canAnalyze || !imageDataUrl) {
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/analyze-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomType: effectiveRoomType,
          style: effectiveStyle,
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
      setGeneratedConceptImage(null);
      setShortlistedContractorIds([]);
      setCopiedContractorId(null);
      setProjectTitle((prev) => prev || `${effectiveRoomType} ${effectiveStyle} plan`);
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
        roomType: effectiveRoomType,
        style: effectiveStyle,
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

  async function handleCopyContractorBrief(group: ContractorMatchGroup, contractor: ContractorMatch) {
    if (!analysis || !costEstimate) {
      return;
    }

    const contractorKey = contractorSelectionKey(group, contractor);
    const brief = buildContractorOutreachBrief({
      analysis,
      costEstimate,
      goals: selectedGoals,
      roomType: effectiveRoomType,
      style: effectiveStyle,
      postalCode: projectPostalCode,
      group,
      match: contractor,
    });

    await navigator.clipboard.writeText(brief);
    setCopiedContractorId(contractorKey);
    setTimeout(() => setCopiedContractorId(null), 1500);
  }

  function toggleContractorShortlist(group: ContractorMatchGroup, contractor: ContractorMatch) {
    const contractorKey = contractorSelectionKey(group, contractor);
    setShortlistedContractorIds((prev) =>
      prev.includes(contractorKey) ? prev.filter((item) => item !== contractorKey) : [...prev, contractorKey],
    );
  }

  async function handleGenerateConcept() {
    if (!imageDataUrl || !promptDraft.trim()) {
      return;
    }

    setIsGeneratingConcept(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate-concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptDraft,
          imageDataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate a concept image right now.");
      }

      const result = (await response.json()) as { imageDataUrl: string };
      setGeneratedConceptImage(result.imageDataUrl);
      setStatusMessage("Generated a concept preview from your prompt.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected image generation error");
    } finally {
      setIsGeneratingConcept(false);
    }
  }

  function handleSaveProject() {
    if (!analysis || !costEstimate) {
      return;
    }

    const nowIso = new Date().toISOString();
    const projectId = `${Date.now()}`;
    const normalizedTitle = projectTitle.trim() || `${effectiveRoomType} renovation plan`;

    const saved = upsertSavedProject({
      id: projectId,
      title: normalizedTitle,
      notes: projectNotes.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
      roomType: effectiveRoomType,
      style: effectiveStyle,
      goals: selectedGoals,
      postalCode: projectPostalCode.trim() || undefined,
      shortlistedContractorIds,
      imageDataUrl: imageDataUrl ?? undefined,
      generatedImageDataUrl: generatedConceptImage ?? undefined,
      analysis,
      costEstimate,
    });

    setSavedProjects(saved);
    setStatusMessage(`Saved "${normalizedTitle}" to local projects.`);
  }

  function loadProject(project: SavedProject) {
    setProjectTitle(project.title);
    setProjectNotes(project.notes ?? "");
    setProjectPostalCode(getSavedPostalCode(project));
    setShortlistedContractorIds(project.shortlistedContractorIds ?? []);
    setCopiedContractorId(null);
    const savedRoomType = project.roomType;
    const savedStyle = project.style;

    if (ROOM_TYPES.includes(savedRoomType as (typeof ROOM_TYPES)[number])) {
      setRoomType(savedRoomType);
      setIsCustomRoomType(false);
      setCustomRoomType("");
    } else {
      setRoomType(ROOM_TYPES[0]);
      setIsCustomRoomType(true);
      setCustomRoomType(savedRoomType);
    }

    if (STYLES.includes(savedStyle as (typeof STYLES)[number])) {
      setStyle(savedStyle);
      setIsCustomStyle(false);
      setCustomStyle("");
    } else {
      setStyle(STYLES[0]);
      setIsCustomStyle(true);
      setCustomStyle(savedStyle);
    }

    setSelectedGoals(project.goals);
    setImageDataUrl(project.imageDataUrl ?? null);
    setAnalysis(project.analysis);
    setPromptDraft(project.analysis.imagePrompt);
    setPromptVariant(0);
    setDidCopyPrompt(false);
    setErrorMessage(null);
    setGeneratedConceptImage(project.generatedImageDataUrl ?? null);
    setStatusMessage(`Loaded "${project.title}" from saved projects.`);
  }

  function handleDeleteProject(projectId: string) {
    const next = deleteSavedProject(projectId);
    setSavedProjects(next);
    setStatusMessage("Deleted project from local storage.");
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
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={isCustomRoomType ? CUSTOM_OPTION : roomType}
                onChange={(event) => {
                  if (event.target.value === CUSTOM_OPTION) {
                    setIsCustomRoomType(true);
                    return;
                  }

                  setRoomType(event.target.value);
                  setIsCustomRoomType(false);
                  setCustomRoomType("");
                }}
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value={CUSTOM_OPTION}>Custom room type…</option>
              </select>
              {isCustomRoomType ? (
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={customRoomType}
                  onChange={(event) => setCustomRoomType(event.target.value)}
                  placeholder="e.g., sunroom, attic, hallway"
                />
              ) : null}
            </label>

            <label className="space-y-2 text-sm font-medium">
              Style
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={isCustomStyle ? CUSTOM_OPTION : style}
                onChange={(event) => {
                  if (event.target.value === CUSTOM_OPTION) {
                    setIsCustomStyle(true);
                    return;
                  }

                  setStyle(event.target.value);
                  setIsCustomStyle(false);
                  setCustomStyle("");
                }}
              >
                {STYLES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value={CUSTOM_OPTION}>Custom style…</option>
              </select>
              {isCustomStyle ? (
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={customStyle}
                  onChange={(event) => setCustomStyle(event.target.value)}
                  placeholder="e.g., Japandi, industrial loft, coastal"
                />
              ) : null}
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Goals</legend>
            <div className="grid grid-cols-2 gap-2">
              {[...GOALS, ...selectedGoals.filter((goal) => !GOALS.includes(goal as (typeof GOALS)[number]))].map((goal) => (
                <label key={goal} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <input type="checkbox" checked={selectedGoals.includes(goal)} onChange={() => toggleGoal(goal)} />
                  <span>{goal}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={customGoalDraft}
                onChange={(event) => setCustomGoalDraft(event.target.value)}
                placeholder="Add your own goal (e.g., improve acoustics)"
              />
              <Button type="button" variant="outline" onClick={handleAddCustomGoal}>
                Add goal
              </Button>
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
        <CardContent className="space-y-5">
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

              {costEstimate ? (
                <section>
                  <h3 className="font-semibold">Cost estimator</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Compare DIY and contractor ranges with scope notes for contractor quoting.
                  </p>
                  <div className="mt-2 overflow-x-auto rounded-md border">
                    <table className="min-w-[620px] w-full text-left text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-2 py-2">Line item</th>
                          <th className="px-2 py-2">DIY range</th>
                          <th className="px-2 py-2">Contractor range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costEstimate.lineItems.map((item) => (
                          <tr key={item.category} className="border-t">
                            <td className="px-2 py-2 align-top">
                              <p className="font-medium">{item.category}</p>
                              <p className="mt-1 text-muted-foreground">{item.scopeNote}</p>
                            </td>
                            <td className="px-2 py-2 align-top">{item.includedInDiyRefresh ? formatCadRange(item.diyRange) : "—"}</td>
                            <td className="px-2 py-2 align-top">
                              {item.includedInFullRenovation ? (
                                <>
                                  <p>{formatCadRange(item.contractorRange)}</p>
                                  <p className="mt-1 text-muted-foreground">{item.contractorSpecialty}</p>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-md border bg-muted/20 p-2">
                      <p className="font-medium">DIY refresh total</p>
                      <p>{formatCadRange(costEstimate.diyRefreshRange)}</p>
                      <p className="text-muted-foreground">Typical: {formatCad(costEstimate.diyRefreshTotal)}</p>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-2">
                      <p className="font-medium">Full renovation total</p>
                      <p>{formatCadRange(costEstimate.fullRenovationRange)}</p>
                      <p className="text-muted-foreground">
                        Typical with {costEstimate.contingencyPercent}% contingency: {formatCad(costEstimate.fullRenovationTotal)}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {costEstimate.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

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

              {costEstimate ? (
                <section className="space-y-3">
                  <div>
                    <h3 className="font-semibold">Contractor matching</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mock recommendations link contractor trades to the estimate lines above.
                    </p>
                  </div>
                  <label className="block space-y-2 text-sm font-medium">
                    Project postal code
                    <input
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      autoComplete="postal-code"
                      value={projectPostalCode}
                      onChange={(event) => setProjectPostalCode(normalizePostalCodeInput(event.target.value))}
                      placeholder="e.g., M5V 2T6"
                    />
                  </label>

                  {projectPostalCode.trim().length < 3 ? (
                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      Enter an Ontario postal code to score service-area fit and generate a trade-by-trade shortlist.
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                        {shortlistedContractorIds.length} shortlisted. Informational only: verify licensing, insurance, availability, and scope
                        directly before hiring.
                      </div>

                      {contractorMatchGroups.map((group) => (
                        <div key={group.trade} className="rounded-md border p-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-sm font-semibold">{group.trade}</h4>
                              <p className="text-xs text-muted-foreground">
                                {group.categories.join(", ")} • planning range {formatCadRange(group.estimateRange)}
                              </p>
                            </div>
                            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{group.matches.length} matches</span>
                          </div>

                          {group.tasks.length ? (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                              {group.tasks.map((task) => (
                                <li key={task}>{task}</li>
                              ))}
                            </ul>
                          ) : null}

                          <div className="mt-3 grid gap-2">
                            {group.matches.map((contractor) => {
                              const contractorKey = contractorSelectionKey(group, contractor);
                              const isShortlisted = shortlistedContractorIds.includes(contractorKey);
                              const didCopyContractor = copiedContractorId === contractorKey;

                              return (
                                <article key={contractorKey} className="rounded-md border bg-background p-3 text-sm">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="font-medium">{contractor.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {contractor.rating.toFixed(1)} rating · {contractor.reviewCount} reviews · fit score {contractor.fitScore}
                                      </p>
                                    </div>
                                    <div className="text-xs text-muted-foreground sm:text-right">
                                      <p>{contractor.leadTimeWeeks} lead time</p>
                                      <p>Minimum {formatCad(contractor.projectMinimum)}</p>
                                    </div>
                                  </div>

                                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                    <p>Expected range: {formatCadRange(contractor.typicalProjectRange)}</p>
                                    <p>{contractor.licenseSummary}</p>
                                    <p>Service area: {contractor.serviceArea}</p>
                                    <p>Scope: {contractor.recommendedScope}</p>
                                  </div>

                                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                    {contractor.reasons.slice(0, 3).map((reason) => (
                                      <li key={reason}>{reason}</li>
                                    ))}
                                  </ul>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={isShortlisted ? "secondary" : "outline"}
                                      onClick={() => toggleContractorShortlist(group, contractor)}
                                    >
                                      {isShortlisted ? <Check className="h-4 w-4" /> : null}
                                      {isShortlisted ? "Shortlisted" : "Shortlist"}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCopyContractorBrief(group, contractor)}
                                    >
                                      {didCopyContractor ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                      {didCopyContractor ? "Brief copied" : "Copy scope brief"}
                                    </Button>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </section>
              ) : null}

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
                  <Button type="button" onClick={handleGenerateConcept} disabled={isGeneratingConcept || !imageDataUrl}>
                    {isGeneratingConcept ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isGeneratingConcept ? "Generating concept..." : "Generate concept image"}
                  </Button>
                </div>
              </section>

              {imageDataUrl && generatedConceptImage ? (
                <section>
                  <h3 className="font-semibold">Original vs concept preview</h3>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Original</p>
                      <div className="relative h-44 overflow-hidden rounded-md border">
                        <Image src={imageDataUrl} alt="Original room upload" fill className="object-cover" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Generated concept</p>
                      <div className="relative h-44 overflow-hidden rounded-md border">
                        <Image src={generatedConceptImage} alt="Generated renovation concept" fill className="object-cover" />
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="space-y-2 rounded-md border p-3">
                <h3 className="font-semibold">Save project</h3>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={projectTitle}
                  onChange={(event) => setProjectTitle(event.target.value)}
                  placeholder="Project title"
                />
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={projectNotes}
                  onChange={(event) => setProjectNotes(event.target.value)}
                  placeholder="Notes (optional)"
                />
                <Button type="button" onClick={handleSaveProject}>Save project to local storage</Button>
                {statusMessage ? <p className="text-xs text-muted-foreground">{statusMessage}</p> : null}
              </section>
            </>
          )}

          <section>
            <h3 className="font-semibold">Saved projects</h3>
            {!savedProjects.length ? (
              <p className="mt-2 text-sm text-muted-foreground">No projects saved yet. Analyze a room and save your first project.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {savedProjects.map((project) => (
                  <li key={project.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">Updated {new Date(project.updatedAt).toLocaleString()}</p>
                    {getSavedPostalCode(project) || project.shortlistedContractorIds?.length ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getSavedPostalCode(project) ? `Postal code ${getSavedPostalCode(project)}` : "No postal code saved"}
                        {project.shortlistedContractorIds?.length ? ` · ${project.shortlistedContractorIds.length} shortlisted` : ""}
                      </p>
                    ) : null}
                    {project.notes ? <p className="mt-1 text-xs text-muted-foreground">{project.notes}</p> : null}
                    <div className="mt-2 flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => loadProject(project)}>
                        Load
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => handleDeleteProject(project.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
