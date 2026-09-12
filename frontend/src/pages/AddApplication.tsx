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
}