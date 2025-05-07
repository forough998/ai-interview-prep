
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/question', async (req, res) => {
  const { role, category } = req.body;
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Generate one ${category.toLowerCase()} interview question for a ${role}.`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    res.json({ question: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Backend error:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});


app.post("/api/feedback", async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "Question and answer are required." });
  }

  try {
    const prompt = `
You are an interview coach. Evaluate the following answer to an interview question. 
Provide constructive feedback and rate the answer from 1 to 10. 
Be concise.

Question: ${question}

Answer: ${answer}

Respond in this format:
Rating: <number>/10
Feedback: <short feedback>
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const feedbackText = response.data.choices[0].message.content.trim();

    res.json({ feedback: feedbackText });

  } catch (error) {
    console.error("Feedback API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get feedback." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

