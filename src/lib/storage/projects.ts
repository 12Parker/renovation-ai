const PROJECTS_KEY = "renovation-ai:projects";

export type SavedProject = {
  id: string;
  title: string;
  createdAt: string;
  notes?: string;
};

export function getSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(PROJECTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as SavedProject[];
  } catch {
    return [];
  }
}

export function saveProject(project: SavedProject): void {
  if (typeof window === "undefined") {
    return;
  }

  const existing = getSavedProjects();
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify([project, ...existing]));
}
