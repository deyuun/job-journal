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
        <div>
          <h1>The Job Journal</h1>
          <p className="tagline">A case file on my own job search.</p>
        </div>

        <svg
          className="masthead-art"
          aria-hidden="true"
          width="200"
          height="120"
          viewBox="0 0 200 120"
        >
          <path className="art-page" d="M28 34 L102 42 L102 104 L28 96 Z" />
          <path className="art-page" d="M102 42 L176 34 L176 96 L102 104 Z" />
          <path
            className="art-lines"
            d="M40 52 L90 57 M40 64 L90 69 M40 76 L90 81 M114 57 L164 52 M114 69 L164 64 M114 81 L164 76"
          />
          <g transform="rotate(32 150 40)">
            <rect className="art-pen" x="144" y="2" width="10" height="56" rx="2" />
            <path d="M144 58 L149 72 L154 58" />
          </g>
          <g className="art-stamp" transform="rotate(-12 42 30)">
            <circle cx="42" cy="30" r="25" />
            <circle cx="42" cy="30" r="21" strokeWidth="1" />
            <text className="art-stamp-text" x="42" y="28" textAnchor="middle">JOB</text>
            <text className="art-stamp-text" x="42" y="39" textAnchor="middle">LOG</text>
          </g>
        </svg>
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