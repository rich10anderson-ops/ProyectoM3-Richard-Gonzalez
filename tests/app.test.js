import { describe, expect, it } from "vitest";
import { getRoute, renderShell, renderView } from "../app.js";

describe("app routing", () => {
  it("returns the chat route definition for /chat", () => {
    expect(getRoute("/chat")).toEqual({ key: "chat", label: "Chat" });
  });

  it("renders the home view content", () => {
    expect(renderView("/")).toContain("Entra al chat pero no hagas ruido, se educado.");
  });

  it("renders chat view with stored messages", () => {
    const html = renderView("/chat", {
      chatState: {
        status: "success",
        error: null,
        messages: [{ role: "assistant", content: "Mission accepted." }],
      },
    });

    expect(html).toContain("Mission accepted.");
  });

  it("renders the loading state in chat view", () => {
    const html = renderView("/chat", {
      chatState: {
        status: "loading",
        error: null,
        messages: [],
      },
    });

    expect(html).toContain("Apolo esta temblando mientras recuerda lo que paso...");
  });

  it("marks the current navigation link as active", () => {
    const html = renderShell("/about", "<section>About</section>");
    expect(html).toContain('class="nav-link is-active"');
  });
});
