import { useState } from "react";
import { createApplication } from "../api";

export default function AddAplication() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!company || !role || !jobDescription){
      setError("Fill in all three fields before filing.");
      return
    }
    setError("");
    setSaving(true);
    try {
      const requirements = requirementsText
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      await createApplication({
        company, role, jobDescription, requirements
      });
      setCompany("");
      setRole("");
      setJobDescription("");    
      setRequirementsText("");
    } catch {
      setError("Couldn't save that. Check the backend is running.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="intake" onSubmit={handleSubmit}>
      <div className="intake-row">
        <div className="field">
          <label>Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value) } placeholder="Acme Corp"/>
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Role</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Junior backend developer"></input>
        </div>
      </div>

      
      <div className="field" style={{ marginBottom: 18 }}>
        <label>Posting text</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the listing as written"
        />
      </div>

      <div className="field" style={{marginBottom: 18}}>
        <label>Skills you noticed (comma seperated)</label>
        <input
          value={requirementsText}
          onChange={(e) => setRequirementsText(e.target.value)}
          placeholder="React, Typescript, 2 years experience"
        />
        {error && <p style={{ color: "var(--rust)", fontSize: 13 }}>{error}</p>} 
        <button className="file-btn" type="submit" disabled={saving}>
          {saving ? "Filing..." : "File this entry"}
        </button>
      </div>
    </form>
  )
}

