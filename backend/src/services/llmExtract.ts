import { extractedRequirementsSchema } from "../validators/schemas.js";

export async function extractRequirements(jobDescription: string): Promise<string[]>{
  const prompt = `Read this job posting and list the concrete skills, technologies, and 
requirements mentioned (e.g. "React", "3 years experience", "Bachelor's degree").
Respond with ONLY valid JSON in this exact shape, nothing else:
{"requirements": ["item1", "item2"]}

Job posting:
${jobDescription}`;
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      message: [{ role: "user", content: prompt }],
      // this is for consistent extraction, not creative variation
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.choices[0].message.content;

  // The model sometimes wraps JSON in ```json fences
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("LLM did not return valid JSON");
  }

  const result = extractedRequirementsSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("LLM response didn't match the expected shape");
  }

  return result.data.requirements;
}