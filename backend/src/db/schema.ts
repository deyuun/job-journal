import {integer, pgTable, serial, text, timestamp} from "drizzle-orm/pg-core";


export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jobDescription: text("job_description").notNull(),
  currentStage: text("current_stage").notNull().default("applied"),
  dateApplied: timestamp("date_applied").notNull().defaultNow(),
})

export const jobRequirements = pgTable("job_requirements", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .references(() => applications.id)
    .notNull(),
  requirement: text("requirements").notNull(),
  source: text("source").notNull().default("manual"),
})

export const stageEvents = pgTable("stage_events", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id")
    .references(
      () => applications.id
    )
    .notNull(),
  stage: text("stage").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
})