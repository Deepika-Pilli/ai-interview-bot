import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState("HR Interview");

  const [mockMode, setMockMode] = useState(false);

  const [scores, setScores] = useState([]);

  const [resume, setResume] = useState(null);

  const [resumeAnalysis, setResumeAnalysis] =
    useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {

    setTimeout(() => {

      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });

    }, 100);

  }, [chat, loading]);

  const sendMessage = async () => {

    if (!message.trim()) return;

    const userMessage = {
      sender: "user",
      text: message,
    };

    setChat((prev) => [...prev, userMessage]);

    setLoading(true);

    try {

      const response = await fetch(
        "http://localhost:5000/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message,
            role,
            mockMode,
          }),
        }
      );

      const data = await response.json();

      const botMessage = {
        sender: "bot",
        text: data.reply,
      };

      const scoreMatch =
        data.reply.match(/Score:\s*(\d+)/i);

      if (scoreMatch) {

        const score = Number(scoreMatch[1]);

        setScores((prev) => [...prev, score]);
      }

      setChat((prev) => [...prev, botMessage]);

    } catch (error) {

      console.log(error);

    }

    setLoading(false);

    setMessage("");
  };

  const clearChat = async () => {

    setChat([]);
    setScores([]);
    setResumeAnalysis("");

    await fetch("http://localhost:5000/clear", {
      method: "POST",
    });
  };

  const analyzeResume = async () => {

    if (!resume) return;

    const formData = new FormData();

    formData.append("resume", resume);

    setLoading(true);

    try {

      const response = await fetch(
        "http://localhost:5000/resume",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      setResumeAnalysis(data.reply);

    } catch (error) {

      console.log(error);

    }

    setLoading(false);
  };

  return (

    <div className="app">

      <h1>AI Interview Preparation Bot</h1>

      <div className="top-bar">

        <button
          className="clear-btn"
          onClick={clearChat}
        >
          Clear Chat
        </button>

        <button
          className="mock-btn"
          onClick={() =>
            setMockMode(!mockMode)
          }
        >
          {mockMode
            ? "Mock Mode ON"
            : "Start Mock Interview"}
        </button>

        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
        >
          <option>HR Interview</option>
          <option>Java Interview</option>
          <option>DSA Interview</option>
          <option>React Interview</option>
          <option>DBMS Interview</option>
        </select>

      </div>

      {scores.length > 0 && (

        <div className="dashboard">

          <div className="card">
            <h3>Total Scores</h3>
            <p>{scores.length}</p>
          </div>

          <div className="card">
            <h3>Latest Score</h3>

            <p>
              {scores[scores.length - 1]}/10
            </p>
          </div>

          <div className="card">
            <h3>Average Score</h3>

            <p>
              {(
                scores.reduce(
                  (a, b) => a + b,
                  0
                ) / scores.length
              ).toFixed(1)}
              /10
            </p>

          </div>

        </div>
      )}

      <div className="resume-section">

        <div className="resume-upload">

          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setResume(e.target.files[0])
            }
          />

          {resume && (
            <p className="file-name">
              Selected: {resume.name}
            </p>
          )}

          <button onClick={analyzeResume}>
            Analyze Resume
          </button>

        </div>

      </div>

      <div className="chat-container">

        {resumeAnalysis && (

          <div className="message bot">

            <ReactMarkdown>
              {resumeAnalysis}
            </ReactMarkdown>

          </div>
        )}

        {chat.map((msg, index) => (

          <div
            key={index}
            className={
              msg.sender === "user"
                ? "message user"
                : "message bot"
            }
          >

            <ReactMarkdown>
              {msg.text}
            </ReactMarkdown>

          </div>
        ))}

        {loading && (

          <div className="message bot">

            <div className="typing">
              <span></span>
              <span></span>
              <span></span>
            </div>

          </div>
        )}

        <div ref={chatEndRef}></div>

      </div>

      <div className="input-area">

        <input
          type="text"
          placeholder="Ask interview questions..."
          value={message}

          onChange={(e) =>
            setMessage(e.target.value)
          }

          onKeyDown={(e) => {

            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <button onClick={sendMessage}>
          Send
        </button>

      </div>

    </div>
  );
}

export default App;
