import { Router } from "express";
import { database } from "../db/index.js";
import { sql } from "drizzle-orm";


export const dashboardRouter = Router();

dashboardRouter.get("/", async(_req, res) => {
  // how many applications EVER reached each stage, in the process, overall.
  const funnel = await database.execute(sql`
    SELECT stage, COUNT(DISTINCT application_id) AS count
    FROM stage_events
    GROUP BY stage
    `);

  const topSkills = await database.execute(sql`
    SELECT requirements AS requirement, COUNT(*) AS count
    FROM job_requirements
    GROUP BY requirements
    ORDER BY count DESC
    LIMIT 10
    `)

  // how many applications are sitting at each stage RIGHT NOW.
  const currentStanding = await database.execute(sql`
    SELECT current_stage, COUNT(*) AS count
    FROM applications
    GROUP BY current_stage
  `);

  const stalledApplications = await database.execute(sql`
    SELECT a.id, a.company, a.role, a.current_stage
    FROM applications a
    WHERE a.id NOT IN (
      SELECT application_id FROM stage_events
      WHERE occurred_at > NOW() - INTERVAL '14 days'
    )
    AND a.current_stage NOT IN ('rejected', 'offer')
  `)

  res.json({
    funnel: funnel.rows, 
    currentStanding: currentStanding.rows, 
    topSkills: topSkills.rows, 
    stalledApplications: stalledApplications.rows
  })
})