"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ROOM_TYPES = ["basement", "bedroom", "kitchen", "laundry room", "office", "living room"] as const;
const STYLES = ["cozy modern", "vintage", "Tudor", "Scandinavian", "moody", "minimalist"] as const;
const GOALS = ["better lighting", "flooring", "storage", "layout", "paint", "built-ins"] as const;

export function RenovationForm() {
  const [roomType, setRoomType] = useState(ROOM_TYPES[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const canAnalyze = useMemo(() => selectedGoals.length > 0, [selectedGoals]);

  function toggleGoal(goal: string) {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal]));
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
            <Upload className="h-7 w-7 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Upload room image (JPG/PNG)</span>
            <input className="hidden" type="file" accept="image/png, image/jpeg" />
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

          <Button className="w-full" disabled={!canAnalyze}>
            Analyze room
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results panel</CardTitle>
          <CardDescription>This panel will show AI room analysis in the next milestone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            Awaiting analysis… choose at least one goal and upload an image to continue.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
