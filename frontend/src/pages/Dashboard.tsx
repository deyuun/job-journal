import { useEffect, useState } from "react"
import { type DashboardData, getDashboard } from "../api"

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

  const maxSkillCount = Math.max(
    ...data.topSkills.map((skill) => skill.count),
    1
  )

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