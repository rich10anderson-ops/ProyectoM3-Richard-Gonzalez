import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const DEFAULT_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE || 0.2);
const DEFAULT_MAX_TOKENS = Number(process.env.GEMINI_MAX_TOKENS || 520);

function toGeminiContents(messages = []) {
  return messages
    .filter((message) => message?.role && message?.content)
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

function getReplyFromResponse(response) {
  const directText = typeof response?.text === "string" ? response.text.trim() : "";
  if (directText) {
    return directText;
  }

  return (
    response?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim() || ""
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = toGeminiContents(Array.isArray(body?.messages) ? body.messages : []);

    if (messages.length === 0) {
      return res.status(400).json({ error: "Messages are required" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: body?.model || DEFAULT_MODEL,
      contents: messages,
      config: {
        systemInstruction:
          body?.system || body?.systemPrompt || "You are a fictional character chatting with the user.",
        temperature:
          typeof body?.temperature === "number" ? body.temperature : DEFAULT_TEMPERATURE,
        maxOutputTokens:
          typeof body?.max_tokens === "number" ? body.max_tokens : DEFAULT_MAX_TOKENS,
      },
    });

    const reply = getReplyFromResponse(response) || "Necesito un instante para ordenar mis pensamientos.";
    const stopReason = response?.candidates?.[0]?.finishReason || null;

    return res.status(200).json({
      reply,
      truncated: stopReason === "MAX_TOKENS",
      stopReason,
    });
  } catch (error) {
    if (error?.status === 429) {
      return res.status(429).json({
        error: error.message || "Demasiadas solicitudes. Intenta de nuevo en un momento.",
        retryAfterSeconds: 5,
      });
    }

    return res.status(error?.status || 500).json({
      error: error?.message || "Unexpected server error",
    });
  }
}
