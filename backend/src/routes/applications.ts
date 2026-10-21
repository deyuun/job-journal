import { Router } from "express";
import { createApplicationSchema, updateStageSchema } from "../validators/schemas.js";
import { applications, jobRequirements, stageEvents } from "../db/schema.js";
import { database } from "../db/index.js";
import { desc, eq } from "drizzle-orm";
import z from "zod";
import { extractRequirements } from "../services/llmExtract.js";


export const router = Router();

router.post("/", async (req, res) => {
  const parsed = createApplicationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({
    error: z.flattenError(parsed.error)
  })

  const {company, role, jobDescription} = parsed.data;

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
  // v2: this ask the AI to read the JD instead of taking manually typed skills.
  // it's also wrapped in try/catch so a flaky free-tier API failure doesn't stop the application itself from saving. Extraction can be retried later.
  try {
    const requirements = await extractRequirements(jobDescription);
    if (requirements.length > 0) {
      await database.insert(jobRequirements).values(
        requirements.map((requirement) => ({
          applicationId: newApp.id,
          requirement,
          source: "ai",
        }))
      )
    }
  } catch (error) {
    console.error("Extraction failed, application still saved:", error)
  }

  res.status(201).json(newApp);
})

router.get("/", async(_req, res) => {
  const all = await database
    .select()
    .from(applications)
    .orderBy(desc(applications.dateApplied));

  res.json(all);
})
  
router.patch("/:id/stage", async (req, res) => {
  const parsed = updateStageSchema.safeParse(req.body);

  if(!parsed.success) {
    return res.status(400).json({
      error: z.flattenError(parsed.error)
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

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  await database
    .delete(stageEvents)
      .where(eq(stageEvents.applicationId, id));
  await database
    .delete(jobRequirements)
      .where(eq(jobRequirements.applicationId, id));
  await database
    .delete(applications)
      .where(eq(applications.id, id))

  res.status(204).send();
})

