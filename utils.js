export const STORAGE_KEY = "fictional-character-chat-history";

export function normalizePath(pathname = "/") {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const sanitized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized = sanitized.replace(/\/+$/, "") || "/";

  if (
    normalized === "/index.html" ||
    normalized === "/src/index.html" ||
    normalized.endsWith("/index.html")
  ) {
    return "/";
  }

  return normalized;
}

export function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    role,
    content: content.trim(),
  };
}

export function createMemoryStorage() {
  const state = new Map();

  return {
    getItem(key) {
      return state.has(key) ? state.get(key) : null;
    },
    setItem(key, value) {
      state.set(key, String(value));
    },
    removeItem(key) {
      state.delete(key);
    },
  };
}

export function loadConversation(storage, key = STORAGE_KEY) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversation(storage, messages, key = STORAGE_KEY) {
  storage?.setItem(key, JSON.stringify(messages));
  return messages;
}

export function debounce(callback, wait = 300) {
  let timeoutId = null;

  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback(...args);
    }, wait);
  };
}

export function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function formatFact(apiResponse) {
  if (!apiResponse || !apiResponse.fact) {
    return "No se encontro informacion";
  }

  return apiResponse.fact.trim();
}

export function isValidTopic(topic) {
  if (!topic) {
    return false;
  }

  const trimmed = topic.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

export function buildAnthropicPayload(
  messages,
  systemPrompt,
  {
    model = "gemini-2.5-flash",
    temperature = 0.2,
    maxTokens = 520,
  } = {},
) {
  return {
    model,
    system: systemPrompt,
    temperature,
    max_tokens: maxTokens,
    messages: messages.map(({ role, content }) => ({ role, content })),
  };
}

export const buildGeminiPayload = buildAnthropicPayload;
