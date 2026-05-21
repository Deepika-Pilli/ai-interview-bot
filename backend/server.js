import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import * as pdfParse from "pdf-parse";


import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5175",
  })
);
app.use(express.json());

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
});

let chatHistory = [];

const upload = multer({
  dest: "uploads/",
});

app.get("/", (req, res) => {
  res.send("AI Interview Bot Backend Running");
});

app.post("/chat", async (req, res) => {

  try {

    const { message, role, mockMode } = req.body;

    chatHistory.push({
      role: "user",
      content: message,
    });

    const historyText = chatHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const prompt = mockMode
? `
You are a strict ${role} interviewer.

Your job:
- conduct mock interviews
- ask one interview question at a time
- evaluate candidate answers
- give score out of 10
- give improvement suggestions
- ask next question

Conversation History:
${historyText}

Candidate Answer:
${message}
`
: `
You are an expert ${role} interviewer.

Conversation History:
${historyText}

Rules:
- give concise answers
- explain clearly
- use bullet points
- help in interview preparation
- provide examples

User Question:
${message}
`;

    const response = await model.invoke(prompt);

    chatHistory.push({
      role: "assistant",
      content: response.content,
    });

    res.json({
      reply: response.content,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: "Something went wrong",
    });

  }
});

app.post("/clear", (req, res) => {

  chatHistory = [];

  res.json({
    message: "Chat cleared",
  });
});

app.post(
  "/resume",
  upload.single("resume"),

  async (req, res) => {

    try {

      const dataBuffer = fs.readFileSync(
        req.file.path
      );

      const pdfData =
        await pdfParse.default(dataBuffer);

      const resumeText = pdfData.text;

      const prompt = `
You are an expert ATS resume analyzer.

Analyze this resume and provide:

1. ATS Score out of 100
2. Technical Skills
3. Strengths
4. Weaknesses
5. Missing Keywords
6. Improvement Suggestions
7. Suitable Job Roles
8. Interview Questions based on resume

Resume:
${resumeText}
`;

      const response =
        await model.invoke(prompt);

      res.json({
        reply: response.content,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: "Resume analysis failed",
      });
    }
  }
);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});