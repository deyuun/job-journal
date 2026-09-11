const BASE_URL = "http://localhost:4000";

export type Application = {
  id: number;
  company: string;
  role: string;
  jobDescription: string;
  currentStage: string;
  dateApplied: string;
};

export async function createApplication(input: {
  company: string;
  role: string;
  jobDescription: string;
  requirements: string[];
}): Promise<Application> {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: {  "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Failed to save application");
  }

  return res.json();
}

export async function getApplications(): Promise<Application[]> {
  const res = await fetch(`${BASE_URL}/applications`);

  if (!res.ok) {
    throw new Error("Failed to load applications");
  }

  return res.json();
}

export async function updateStage(id: number, stage: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({
      stage: stage
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to update stage")
  }
}

export type DashboardData = {
  funnel: { stage: string; count: number}[];
  topSkills: { requirements: string; count: number}[];
  stalled: { id: number; company: string; role: string; current_stage: string}[];
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) {
    throw new Error("Failed to load dashboard");
  }

  return res.json();
}