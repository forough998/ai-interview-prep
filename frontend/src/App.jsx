import { useState, useRef } from "react";
import { fetchAIQuestion } from "./api";

export default function App() {
  const QUESTION_TIME_LIMIT = 120; // Change this to set the timer globally

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [role, setRole] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [feedbacks, setFeedbacks] = useState({});
  const [category, setCategory] = useState("Technical");

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [timerId, setTimerId] = useState(null);

  const submittingRef = useRef(false); // Prevents double submits
  const answerRef = useRef("");

  const apiBase = import.meta.env.VITE_API_URL;

  // Stop any running timer
  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  // Start the countdown
  const startTimer = () => {
    stopTimer(); // Clear any previous timer

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setTimerId(null);
          autoSubmit(); // Submit automatically
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerId(id);
  };

  // Fetch feedback from backend
  const getFeedback = async (questionText, userAnswer) => {
    try {
      const response = await fetch(`${apiBase}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: questionText, answer: userAnswer }),
      });

      const data = await response.json();
      return data.feedback || "No feedback received.";
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return "Error getting feedback.";
    }
  };

  // Load next question helper (centralized logic)
  const loadNextQuestion = async () => {
    const q = await fetchAIQuestion(role || "data engineer", category);
    setQuestion(q);
    setAnswer("");
    answerRef.current = "";
    setTimeLeft(QUESTION_TIME_LIMIT);
    startTimer();
  };

  // Auto-submit when time runs out
  const autoSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    stopTimer();

    if (!question) {
      submittingRef.current = false;
      return;
    }

    const feedback = await getFeedback(question, answerRef.current);

    setHistory((prev) => [...prev, { question, answer: answerRef.current }]);
    setFeedbacks((prev) => ({ ...prev, [question]: feedback }));

    await loadNextQuestion();
    submittingRef.current = false;
  };

  const handleStart = async () => {
    setInterviewStarted(true);
    const q = await fetchAIQuestion(role || "data engineer", category);
    setQuestion(q);
    setAnswer("");
    answerRef.current = "";
    setTimeLeft(QUESTION_TIME_LIMIT);
    startTimer();
  };

  const handleNext = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    stopTimer();

    if (!question) {
      submittingRef.current = false;
      return;
    }

    const feedback = await getFeedback(question, answer);

    setHistory((prev) => [...prev, { question, answer }]);
    setFeedbacks((prev) => ({ ...prev, [question]: feedback }));

    await loadNextQuestion();
    submittingRef.current = false;
  };

  const handleEnd = () => {
    setInterviewStarted(false);
    setQuestion("");
    setAnswer("");
    answerRef.current = "";
    setHistory([]);
    setTimeLeft(QUESTION_TIME_LIMIT);
    stopTimer();
  };

  return (
    <div className="min-h-screen pt-32 flex flex-col items-center justify-start bg-gradient-to-b from-white to-blue-50 text-gray-800 px-4 text-center">
      <header className="fixed top-0 left-0 w-full bg-white border-b shadow-md z-20 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">AI Interview Prep</h1>
          <p className="text-gray-600 text-sm mt-1">
            Get AI-generated interview questions tailored to your dream job.
          </p>
        </div>
      </header>

      {!interviewStarted && (
        <>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="👤 What job are you applying for? (e.g. Frontend Developer)"
            className="mb-6 p-3 border border-gray-300 rounded w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mb-6 p-3 border border-gray-300 rounded w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="Technical">Technical</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Problem-solving">Problem-solving</option>
          </select>

          <button
            onClick={handleStart}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Start Interview
          </button>
        </>
      )}

      {interviewStarted && question && (
        <>
          <div className={`mb-2 text-lg font-semibold ${
              timeLeft > 10 ? 'text-green-600' : timeLeft > 5 ? 'text-orange-600' : 'text-red-600 font-bold'
            }`}>
              Time left: {timeLeft} seconds
            </div>
          <div className="mb-4 text-xl font-medium max-w-xl">{question}</div>
          <textarea
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              answerRef.current = e.target.value;
            }}
            placeholder="✍️ Type your answer here..."
            className="w-full max-w-xl h-32 p-4 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <div className="flex gap-4">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Next Question
            </button>
            <button
              onClick={handleEnd}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              End Interview
            </button>
          </div>
        </>
      )}

      {history.length > 0 && (
        <div className="mt-10 max-w-xl w-full">
          <h2 className="text-2xl font-semibold mb-4 text-left">
            📝 Your Answers
          </h2>
          <div className="max-h-60 overflow-y-auto space-y-4 text-left">
            {history.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-white border border-gray-200 rounded shadow-sm"
              >
                <p className="font-medium text-gray-700">{item.question}</p>
                <p className="text-gray-600 mt-2">Your Answer: {item.answer}</p>
                {feedbacks[item.question] && (
                  <div className={`mt-2 p-3 rounded text-left border ${
                    feedbacks[item.question].toLowerCase().includes("rating: 7") ||
                    feedbacks[item.question].toLowerCase().includes("rating: 8") ||
                    feedbacks[item.question].toLowerCase().includes("rating: 9") ||
                    feedbacks[item.question].toLowerCase().includes("rating: 10")
                      ? "bg-green-50 border-green-400 text-green-800"
                      : "bg-yellow-50 border-yellow-400 text-yellow-800"
                  }`}>
                    <strong>💡 Feedback:</strong> {feedbacks[item.question]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
