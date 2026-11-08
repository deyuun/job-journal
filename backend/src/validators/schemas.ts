import z from "zod";

export const PLATFORMS = [
  "LinkedIn",
  "Upwork",
  "Facebook",
  "Indeed",
  "Freeup",
  "Kalibrr",
  "Gigacx",
  "Galasya",
  "Jobstreet",
  "Bossjob",
  "OnlineJobs",
  "Naukrigulf",
  "JobsLin",
  "Uplift",
  "Others",
] as const;

// true only for real http:// or https:// links
function isHttpLink(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

// "" means  no link was given. Anything else must be a real http(s) link.
// Why not allow any link: it ends up in an href, and a link like
// javascript:alert(1) runs code when someone clicks it.
const optionalJobUrl = z
  .string()
  .refine(
    (value) => value === "" || isHttpLink(value),
    "Use a full link that starts with http:// or https://",
)

export const createApplicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  jobDescription: z.string().min(1, "Paste the job description"),
  // requirements: z.array(z.string()).optional(),
  platform: z.enum(PLATFORMS, { error: "Pick the platform" }),
  jobUrl: optionalJobUrl.optional(),
})

export const updateStageSchema = z.object({
  stage: z.enum([
    "applied", "screen", "assessment", "interview",
    "final", "offer", "rejected", "ghosted"
  ])
})

// This shape requires the AI to respond in. This validates the AI's JSON response
// against this before trusting it, the same way it validates the incoming request bodies.
export const extractedRequirementsSchema = z.object({
  requirements: z.array(z.string()),
})

// Shape of a date edit. The date input on the page sends "YYYY-MM-DD"
export const updateDateSchema = z.object({
  dateApplied: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD"),
})

// Shape an edit to the platform and link from the expanded row
export const updateDetailsSchema = z.object({
  platform: z.enum(PLATFORMS, { error: "Pick the platform" }),
  jobUrl: optionalJobUrl,
})

// The shape of a note, used for both adding and editing. 
// trim() runs first, so a note made only of spaces counts as empty
export const noteSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(2000, "Keep a note under 2000 characters"),
})