import "dotenv/config";
import express from "express";
import cors from "cors";
import { applicationsRouter } from "./routes/applications.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express()

app.use(cors());
app.use(express.json());

app.use("/applications", applicationsRouter);
app.use("/dashboard", dashboardRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
