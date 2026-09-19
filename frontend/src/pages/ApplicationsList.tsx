import { useEffect, useState } from "react"
import { type Application, deleteApplication, getApplications, updateStage } from "../api"

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

  // Tracks which row (by application id) is currently expanded | null means nothing is expanded
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  async function handleDelete(id: number, company: string) {
    const confirmed = window.confirm(`Delete the ${company} application? This can't be undone.`)
    if (!confirmed) {
      return
    }
    await deleteApplication(id);
    load();
  }

  function toggleExpanded(id: number) {
    if (expandedId === id) {
        setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  }

  if (loading) {
    return <p style={{color: "var(--ink-soft)"}}>Loading...</p>;
  }
  if (apps.length === 0) {
    return <p style={{ color: "var(--ink-soft)" }}>No applications filed yet.</p>
  }
  
  return (
    <div>
      {apps.map((app, index) => {
        const isExpanded = expandedId === app.id;

          return (
            <div key={app.id}>
              <div className={`ledger-row ${index === 0 ? "first-row": ""}`}>
                <div className={`tab ${tabClass(app.currentStage)}`} />
                
                <span
                  onClick={() => toggleExpanded(app.id)}
                  style={{
                    cursor: "pointer",
                    fontFamily: "IBM Plex Mono, monospace",
                    color: "var(--pine)",
                    width: 14,
                    flexShrink: 0,
                  }}
                >
                  {isExpanded ? "-" : "+"}
                </span>

                <div className="ledger-company" onClick={() => toggleExpanded(app.id)} style={{cursor: "pointer"}}>
                  {app.company}
                </div>
                
                <div className="ledger-role" onClick={() => toggleExpanded(app.id)} style={{cursor: "pointer"}}>
                  {app.role}
                </div>
                <select
                  className="stage-select"
                  value={app.currentStage}
                  onChange={(e) => handleStageChange(app.id, e.target.value)}
                >
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleDelete(app.id, app.company)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--rust)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                  aria-label={`Delete ${app.company} application`}
                >
                  del
                </button>
              </div>

              {isExpanded && (
                <div
                  style={{
                    background: "var(--paper-raised)",
                    border: "1px solid var(--rule)",
                    borderTop: "none",
                    padding: "16px 20px",
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    maxHeight: 220,
                    overflowY: "auto"
                  }}
                >
                  {app.jobDescription}
                </div>
              )}
            </div>
          );
      })}
    </div>
  )
}