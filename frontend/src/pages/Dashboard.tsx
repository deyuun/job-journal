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

  return (
    <div>
      <section>
        <p></p>
      </section>

      <section>

      </section>

      <section>

      </section>
    </div>
  )
}