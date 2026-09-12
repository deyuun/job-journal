import { useState } from "react";
import "./styles/ledger.css";
import AddApplication from "./pages/AddApplication";
import ApplicationsList from "./pages/ApplicationsList";
import Dashboard from "./pages/Dashboard";

type Page = "add" | "list" | "dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("add");

  return (
    <div className="sheet">
      <div className="masthead">
        <h1>Job Journal</h1>
        <span className="case-no">FILE - SELF</span>
      </div>

      <nav className="nav-tabs">
        <a className={page === "add" ? "active" : ""} onClick={() => setPage("add")}>new entry</a>
        <a className={page === "list" ? "active" : ""} onClick={() => setPage("list")}>open cases</a>
        <a className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>standing</a>
      </nav>

      {page === "add" && <AddApplication />}
      {page === "list" && <ApplicationsList />}
      {page === "dashboard" && <Dashboard />}
    </div>
  )
}