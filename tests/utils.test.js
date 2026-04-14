import { describe, expect, it } from "vitest";
import {
  buildAnthropicPayload,
  createMemoryStorage,
  formatFact,
  isValidTopic,
  loadConversation,
  normalizePath,
  saveConversation,
} from "../utils.js";

describe("utils", () => {
  it("normalizes nested routes and removes trailing slashes", () => {
    expect(normalizePath("chat/")).toBe("/chat");
    expect(normalizePath("/about/")).toBe("/about");
  });

  it("saves and loads conversation history from storage", () => {
    const storage = createMemoryStorage();
    const messages = [{ role: "user", content: "Hello" }];

    saveConversation(storage, messages);

    expect(loadConversation(storage)).toEqual(messages);
  });

  it("builds a Gemini-compatible payload with explicit controls", () => {
    const payload = buildAnthropicPayload(
      [{ role: "assistant", content: "Welcome aboard." }],
      "Stay in character.",
      {
        model: "gemini-2.5-flash",
        temperature: 0.2,
        maxTokens: 40,
      },
    );

    expect(payload).toEqual({
      model: "gemini-2.5-flash",
      system: "Stay in character.",
      temperature: 0.2,
      max_tokens: 40,
      messages: [{ role: "assistant", content: "Welcome aboard." }],
    });
  });

  it("formats a fact response and trims whitespace", () => {
    expect(formatFact({ fact: "  Los castillos resistian largos asedios.  " })).toBe(
      "Los castillos resistian largos asedios.",
    );
  });

  it("returns a fallback when the fact response is missing", () => {
    expect(formatFact(null)).toBe("No se encontro informacion");
    expect(formatFact({})).toBe("No se encontro informacion");
  });

  it("validates topics with a length between 2 and 50 characters", () => {
    expect(isValidTopic("guerra")).toBe(true);
    expect(isValidTopic("  Apolo  ")).toBe(true);
    expect(isValidTopic("a")).toBe(false);
    expect(isValidTopic(" ".repeat(5))).toBe(false);
    expect(isValidTopic("x".repeat(51))).toBe(false);
  });
});
