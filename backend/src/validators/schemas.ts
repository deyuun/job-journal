import z from "zod";

export const createApplicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  jobDescription: z.string().min(1, "Paste the job description"),
  requirements: z.array(z.string()).optional(),
})

export const updateStageSchema = z.object({
  stage: z.enum([
    "applied", "screen", "assessment", "interview",
    "final", "offer", "rejected", "ghosted"
  ])
})