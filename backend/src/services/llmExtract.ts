import { extractedRequirementsSchema } from "../validators/schemas.js";

export async function extractRequirements(jobDescription: string): Promise<string[]>{
  const prompt = `Extract the technical requirements from this job posting.

Rules:
- Use short, standard names, like "React", "TypeScript", "SQL", "Git", "Playwright", "Azure", "Node.js".
- One skill per item. Split combined phrases: "JavaScript or TypeScript" becomes "JavaScript" and "TypeScript".
- Include technologies, frameworks, tools, and platforms. Include experience and degree requirements as short items, like "2 years experience".
- Skip soft skills and generic phrases such as communication, teamwork, remote work, or quality mindset.
- No duplicates. Maximum 20 items.

Respond with ONLY valid JSON in this exact shape:
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
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      // this is for consistent extraction, not creative variation
      temperature: 0,
      reasoning_effort: "low",
      max_completion_tokens: 2000,
    }),
  });

  if (!response.ok) {
    // Groq explains what went wrong in the response body. Include it,
    // otherwise all we ever see is a bare status code.
    const errorBody = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const choice = await data.choices[0];
  const rawText = choice.message.content ?? "";

  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  const cleaned = start !== -1 && end > start ? rawText.slice(start, end + 1): rawText;

  // The model sometimes wraps JSON in ```json fences
  // const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // finish_reason "length" means the label was cut off by the token limit
    console.error(
      "Could not parse LLM output, finish_reason:",
      choice.finish_reason,
      "content:",
      rawText.slice(0, 500)
    );
    throw new Error("LLM did not return valid JSON");
  }

  const result = extractedRequirementsSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("LLM response didn't match the expected shape");
  }

  return result.data.requirements;
}