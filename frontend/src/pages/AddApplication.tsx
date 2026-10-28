import { useState } from "react";
import { createApplication, PLATFORMS } from "../api";

export default function AddApplication() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!company || !role || !jobDescription || !platform){
      setError("Fill in the company, role, platform, and posting text before filing.");
      return
    }

    const link = jobUrl.trim();

    if (link !== "" && !link.startsWith("http://") && !link.startsWith("https://")) {
      setError("The link needs to starts with http:// or https://");
      return
    }

    setError("");
    setSaving(true);
    try {
      await createApplication({
        company, role, platform, jobUrl: link, jobDescription
      });
      setCompany("");
      setRole("");
      setPlatform("");
      setJobUrl("");
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

      <div className="intake-row">
        <div className="field">
          <label>Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">Where did you find it?</option>
            {PLATFORMS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="field">
            <label>Link to the post (optional)</label>
            <input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://..."/>
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

