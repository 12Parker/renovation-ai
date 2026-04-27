import { RenovationForm } from "@/components/renovation-form";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 text-slate-900 md:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-3">
          <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Milestone 1 — Static app shell
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Renovation AI</h1>
          <p className="max-w-3xl text-slate-600">
            Turn room photos into practical renovation plans with clear priorities, budget tiers, and a generated redesign prompt.
          </p>
        </header>
        <RenovationForm />
      </div>
    </main>
  );
}
