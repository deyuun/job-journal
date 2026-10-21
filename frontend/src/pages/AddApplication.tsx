import { useState } from "react";
import { createApplication } from "../api";

export default function AddApplication() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
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
      await createApplication({
        company, role, jobDescription
      });
      setCompany("");
      setRole("");
      setJobDescription("");
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
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Junior backend developer"/>
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

      {error && <p style={{ color: "var(--rust", fontSize: 13}}>{error}</p>}
      <button className="file-btn" type="submit" disabled={saving}>
        {saving ? "Filing..." : "File this entry"}
      </button>    
    </form>
  )
}

