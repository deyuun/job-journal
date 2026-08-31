import {pgTable, text, timestamp} from "drizzle-orm/pg-core";


export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jobDescription: text("job_description").notNull(),
  currentStage: text("current_stage").notNull().default("applied"),
  dateApplied: timestamp("date_applied").notNull.defaultNow(),
})