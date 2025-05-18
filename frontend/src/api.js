import axios from "axios";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

// api.js
export async function fetchAIQuestion(role = "data engineer",
                                      category = "Technical") {
  const res = await fetch(`${apiBase}/api/question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, category })
  });

  // ⬇️  If backend sent 400 we throw, so caller can alert the user
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "Request failed");
  }

  return body.question;
}


