import { describe, expect, it } from "vitest";
import {
  buildAnthropicPayload,
  createMemoryStorage,
  loadConversation,
  normalizePath,
  saveConversation,
} from "../src/utils.js";

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

  it("builds an Anthropic payload with explicit controls", () => {
    const payload = buildAnthropicPayload(
      [{ role: "assistant", content: "Welcome aboard." }],
      "Stay in character.",
      {
        model: "claude-3-5-sonnet-latest",
        temperature: 0.2,
        maxTokens: 40,
      },
    );

    expect(payload).toEqual({
      model: "claude-3-5-sonnet-latest",
      system: "Stay in character.",
      temperature: 0.2,
      max_tokens: 40,
      messages: [{ role: "assistant", content: "Welcome aboard." }],
    });
  });
});
