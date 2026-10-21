import z from "zod";

export const createApplicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  jobDescription: z.string().min(1, "Paste the job description"),
  // requirements: z.array(z.string()).optional(),
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