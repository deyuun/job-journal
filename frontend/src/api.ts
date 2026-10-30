const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Keep in sync with PLATFORMS in the backend validator
export const PLATFORMS = [
  "LinkedIn", "Upwork", "Facebook", "Indeed", "FreeUp", "Kalibrr", "Gigcx",
  "Galasya", "Jobstreet", "BossJob", "OnlineJobs", "Naukrigulf", "JobsLin",
  "Uplilft", "Others",
];

export type Application = {
  id: number;
  company: string;
  role: string;
  jobDescription: string;
  currentStage: string;
  dateApplied: string;
  platform: string | null;
  jobUrl: string | null;
};

export type TimelineItem = {
  kind: "stage" | "note";
  id: number;
  date: string;
  text: string;
}

export async function createApplication(input: {
  company: string;
  role: string;
  jobDescription: string;
  platform: string;
  jobUrl: string;
  // requirements: string[]; 
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

export async function deleteApplication(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete application")
  }
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

export async function updateDate(id: number, dateApplied: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}/date`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ dateApplied }),
  })

  if (!res.ok) {
    throw new Error("Failed to update date")
  }
}

export type DashboardData = {
  funnel: { stage: string; count: number}[];
  currentStanding: { current_stage: string; count: number }[];
  topSkills: { requirement: string; count: number}[];
  stalled: { id: number; company: string; role: string; current_stage: string}[];
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) {
    throw new Error("Failed to load dashboard");
  }

  const data = await res.json();
  return {
    funnel: data.funnel,
    currentStanding: data.currentStanding,
    topSkills: data.topSkills,
    stalled: data.stalledApplications,
  };
}

export async function updateDetails(id: number, platform: string, jobUrl: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}/details`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform, jobUrl
    })
  })

  if (!res.ok) {
    throw new Error("Failed to update details")
  }
}

// TIMELINE and NOTES

export async function getTimeline(id: number): Promise <TimelineItem[]> {
  const res = await fetch(`${BASE_URL}/applications/${id}/timeline`);
  if (!res.ok) {
    throw new Error("Failed to load the Timeline")
  }
  return res.json();
}

export async function addNote(id: number, body: string): Promise<void>{
  const res = await fetch(`${BASE_URL}/applications/${id}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      body
    })
  })

  if (!res.ok) {
    throw new Error("Failed to add the role");
  }
}

export async function updateNote(id: number, noteId: number, body: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}/notes/${noteId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body })
  })

  if (!res.ok) {
    throw new Error("Failed to update the note");
  }
}

export async function deleteNote(id: number, noteId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/applications/${id}/notes/${noteId}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    throw new Error(
      "Failed to delete the role"
    )
  }
}