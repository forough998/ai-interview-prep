import axios from "axios";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function fetchAIQuestion(role = "data engineer", category = "Technical") {
  const response = await fetch(`${apiBase}/api/question`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role, category }),
  });

  const data = await response.json();
  return data.question || "No question generated.";
}

