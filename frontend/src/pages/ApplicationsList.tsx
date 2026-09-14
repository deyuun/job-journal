import { useEffect, useState } from "react"
import { type Application, getApplications, updateStage } from "../api"

const STAGES = ["applied", "screen", "assessment", "interview", "final", "offer", "rejected", "ghosted"]

function tabClass(stage: string){
  if (["interview", "final", "offer"].includes(stage)){
    return "moving";
  }
  if (["rejected", "ghosted"].includes(stage)){
    return "stalled"
  }

  return "waiting";
}
export default function ApplicationsList() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getApplications();
    setApps(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [])

  async function handleStageChange(id: number, stage: string){
    await updateStage(id, stage);
    load();
  }

  if (loading) {
    return <p style={{color: "var(--ink-soft)"}}>Loading...</p>;
  }
  if (apps.length === 0) {
    return <p style={{ color: "var(--ink-soft)" }}>No applications filed yet.</p>
  }
  
  return (
    <div>
      {apps.map((app) => (
        <div className="ledger-row" key={app.id}>
          <div className={`tab ${tabClass(app.currentStage)}`} />
          <div className="ledger-company">{app.company}</div>
          <div className="ledger-role">{app.role}</div>
          <select
            className="stage-select"
            value={app.currentStage}
            onChange={(e) => handleStageChange(app.id, e.target.value)}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
    
  )
}