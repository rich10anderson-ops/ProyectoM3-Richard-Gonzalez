const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
const DEFAULT_TEMPERATURE = Number(process.env.ANTHROPIC_TEMPERATURE || 0.2);
const DEFAULT_MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS || 120);
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION || "2023-06-01";

function toAnthropicMessages(messages = []) {
  return messages
    .filter((message) => message?.role && message?.content)
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function getResponseText(content = []) {
  return content
    .filter((block) => block?.type === "text" && block?.text)
    .map((block) => block.text)
    .join("")
    .trim();
}

function parseRetryAfterSeconds(headerValue) {
  if (!headerValue) {
    return null;
  }

  const seconds = Number(headerValue);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds;
  }

  const retryDate = new Date(headerValue);
  const retryTimestamp = retryDate.getTime();

  if (Number.isNaN(retryTimestamp)) {
    return null;
  }

  return Math.max(0, Math.ceil((retryTimestamp - Date.now()) / 1000));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = toAnthropicMessages(Array.isArray(body?.messages) ? body.messages : []);

    if (messages.length === 0) {
      return res.status(400).json({ error: "Messages are required" });
    }

    const payload = {
      model: body?.model || DEFAULT_MODEL,
      system: body?.system || body?.systemPrompt || "You are a fictional character chatting with the user.",
      temperature:
        typeof body?.temperature === "number" ? body.temperature : DEFAULT_TEMPERATURE,
      max_tokens:
        typeof body?.max_tokens === "number" ? body.max_tokens : DEFAULT_MAX_TOKENS,
      messages,
    };

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      const error = data?.error?.message || "Anthropic request failed";
      const retryAfterSeconds = parseRetryAfterSeconds(
        anthropicResponse.headers.get("retry-after"),
      );

      if (anthropicResponse.status === 429) {
        if (retryAfterSeconds !== null) {
          res.setHeader("Retry-After", String(retryAfterSeconds));
        }

        return res.status(429).json({
          error,
          retryAfterSeconds,
        });
      }

      return res.status(anthropicResponse.status).json({ error });
    }

    const reply = getResponseText(data?.content) || "Necesito un instante para ordenar mis pensamientos.";
    const stopReason = data?.stop_reason || null;

    return res.status(200).json({
      reply,
      truncated: stopReason === "max_tokens",
      stopReason,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected server error" });
  }
}
