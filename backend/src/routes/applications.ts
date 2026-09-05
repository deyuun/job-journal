import { Router } from "express";
import { createApplicationSchema, updateStageSchema } from "../validators/schemas.js";
import { applications, jobRequirements, stageEvents } from "../db/schema.js";
import { database } from "../db/index.js";
import { desc, eq } from "drizzle-orm";


export const applicationsRouter = Router();

applicationsRouter.post("/", async (req, res) => {
  const parsed = createApplicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    error: parsed.error.flatten()
  })

  const {company, role, jobDescription, requirements} = parsed.data;

  const [newApp] = await database
    .insert(applications)
    .values({company, role, jobDescription, currentStage: "applied" })
    .returning();

  if (!newApp) {
    return res.status(500).json({
      error: "Failed to create application"
    })
  }

  await database.insert(stageEvents)
    .values({
      applicationId: newApp.id,
      stage: "applied"
    })

  if (requirements && requirements.length > 0){
    await database.insert(jobRequirements).values(
      requirements.map((requirement) => ({
        applicationId: newApp.id,
        requirement,
        source:  "manual",
      }))
    )
  }

  res.status(201).json(newApp);
})

applicationsRouter.get("/", async(_req, res) => {
  const all = await database
    .select()
    .from(applications)
    .orderBy(desc(applications.dateApplied));

  res.json(all);
})
  
applicationsRouter.patch("/:id/stage", async (req, res) => {
  const parsed = updateStageSchema.safeParse(req.body);

  if(!parsed.success) {
    return res.status(400).json({
      error: parsed.error.flatten()
    })
  }

  const id = Number(req.params.id);
  const { stage } = parsed.data;

  await database
    .update(applications)
    .set({
      currentStage: stage
    })
    .where(
      eq(applications.id, id)
    )

  await database
    .insert(stageEvents)
    .values({
    applicationId: id, stage
  })

  res.json({
    id, stage
  })
})

