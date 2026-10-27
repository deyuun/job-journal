import { Router } from "express";
import { createApplicationSchema, updateDateSchema, updateDetailsSchema, updateStageSchema } from "../validators/schemas.js";
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

  const {company, role, jobDescription, platform } = parsed.data;

  let jobUrl: string | null = null;
  if (parsed.data.jobUrl) {
    jobUrl = parsed.data.jobUrl;
  }

  const [newApp] = await database
    .insert(applications)
    .values({company, role, jobDescription, platform, jobUrl, currentStage: "applied" })
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

/**
 * PATCH /applications/:id/date
 * Lets you correct the date an application was filed under.
*/
router.patch("/:id/date", async (req, res) => {
  const parsed = updateDateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: z.flattenError(parsed.error)
    })
  }

  const id = Number(req.params.id);

  // Noon UTC instead of midnight, so the calendar doesnt slip day before or after
  // when it's shown in a different time zone
  const newDate = new Date(`${parsed.data.dateApplied}T12:00:00Z`);

  const year = newDate.getUTCFullYear();
  // The format check for example ("2026-13-45" through, but that isn't a real date)
  if (Number.isNaN(newDate.getTime()) || year < 2000 || year > 2100) {
    return res.status(400).json({
      error: "That isn't a real date"
    });
  }

  await database.update(applications)
    .set({
      dateApplied: newDate
    })
    .where(
      eq(
        applications.id, id
      ));
  res.json({
    id, dateApplied: newDate
  })
})

/**
 * PATCH /applications/:id/details
 * This can change the platform and link of an application
*/

router.patch("/:id/details", async (req, res) => {
  const parsed = updateDetailsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({error: z.flattenError(parsed.error)})
  }

  const id = Number(req.params.id);
  const { platform } = parsed.data;

  // An empty string means the link was cleared
  let jobUrl: string | null = null;
  if (parsed.data.jobUrl !== "") {
    jobUrl = parsed.data.jobUrl
  }

  await database
    .update(applications)
      .set({
        platform, jobUrl
      })
        .where((
          eq(applications.id, id)
        ))

  res.json({ id, platform, jobUrl })
})
