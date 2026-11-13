import { useEffect, useState } from "react"
import { type DashboardData, getDashboard } from "../api"

const STAGES = ["applied", "screen", "assessment", "interview", "final", "offer", "rejected", "ghosted"]

// This has the same colors from open cases
function stageClass(stage: string) {
  if (["interview", "final", "offer"].includes(stage)) {
    return "moving";
  }
  if (["rejected", "ghosted"].includes(stage)) {
    return "stalled";
  }
  return "waiting";
}

export default function Dashboard(){
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const result = await getDashboard();
      setData(result);
    }
    load();
  }, [])

  if (!data) {
    return <p style={{color: "var(--ink-soft)"}}>Loading...</p>;
  }

  // The database sends the stages in any order (yours came back alphabetical),
  // so these loops put them in the same order as the pipeline.
  // The counts arrive as text from Postgres, so Number() turns them into numbers.
  const rightNow: { stage: string; count: number}[] = [];
  for (const stage of STAGES) {
    const found = data.currentStanding.find((item) => item.current_stage === stage);
    if (found) {
      rightNow.push({
        stage, count: Number(found.count)
      });
    }
  }

  const everReached: { stage: string; count: number }[] = [];
  for (const stage of STAGES) {
    const found = data.funnel.find((item) => item.stage === stage);
    if (found) {
      everReached.push({
        stage, count: Number(found.count)
      })
    }
  }

  // const maxSkillCount = Math.max(
  //   ...data.topSkills.map((skill) => skill.count),
  //   1
  // )

  // The biggest skill count, so the bars can be drawn as a share of it
  let maxSkillCount = 1;
  for (const skill of data.topSkills) {
    if (Number(skill.count) > maxSkillCount) {
      maxSkillCount = Number(skill.count);
    }
  }

  return (
    <div>
      <section>
        <p className="section-label">Right now</p>
        {data.currentStanding.map((item) => (
          <div className="tally-line" key={item.current_stage}>
            <span>{item.current_stage}</span>
            <span>{item.count}</span>
          </div>
        ))}
      </section>

      <section style={{marginTop: 36}}>
        <p className="section-label">Where applications have been</p>
        {data.funnel.map((item) => (
          <div className="tally-line" key={item.stage}>
            <span>{item.stage}</span>
            <span>{item.count}</span>
          </div>
        ))}
      </section>

      <section style={{marginTop: 36}}>
        <p className="section-label">What keeps getting asked for</p>
        {data.topSkills.map((skill) => (
          <div className="skill-line" key={skill.requirement}>
            <div className="skill-head">
              <span>{skill.requirement}</span>
              <span className="count">{skill.count}</span>
            </div>

            <div className="skill-track">
              <div className="skill-fill" style={{ width: `${(skill.count / maxSkillCount) * 100}%` }} />
            </div>
          </div>
        ))}
      </section>
      
      {data.stalled.length > 0 && (
        <section style={{marginTop: 36}}>
          <p className="section-label">Gone quiet past 14 days</p>
          {data.stalled.map((item) => (
            <div className="ledger-row" key={item.id}>
              <div className="tab stalled" />
              <div className="ledger-company">{item.company}</div>
              <div className="ledger-role">{item.role}</div>
              <div style={{fontFamily: "IBM Plex Mono, monospace", fontSize: 12}}>{item.current_stage}</div>
            </div>
          ))}

        </section>
      )}
      
    </div>
  )
}