import { beforeEach, describe, expect, it, vi } from "vitest";
import { APOLLO_PROFILE, CHARACTER_PROMPT, createSystemPrompt, requestCharacterReply } from "../chat.js";

describe("requestCharacterReply", () => {
  const messages = [{ role: "user", content: "Apolo, habla de la guerra." }];
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
  });

  it("deberia obtener una respuesta del personaje exitosamente", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        reply: "He visto la guerra y no he caido ante ella.",
        truncated: false,
        stopReason: "STOP",
      }),
    });

    const result = await requestCharacterReply(messages, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith("/api/functions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: expect.any(String),
    });

    expect(result).toEqual({
      reply: "He visto la guerra y no he caido ante ella.",
      truncated: false,
      stopReason: "STOP",
    });
  });

  it("deberia manejar errores de la API", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: "Solicitud invalida para invocar a Apolo.",
      }),
    });

    await expect(requestCharacterReply(messages, fetchMock)).rejects.toThrow(
      "Solicitud invalida para invocar a Apolo.",
    );
  });

  it("deberia manejar errores de red", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    await expect(requestCharacterReply(messages, fetchMock)).rejects.toThrow("Network error");
  });

  it("deberia manejar respuestas que no devuelven JSON valido", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("Unexpected end of JSON input");
      },
    });

    await expect(requestCharacterReply(messages, fetchMock)).rejects.toThrow(
      "El backend no devolvio un JSON valido.",
    );
  });
});

describe("createSystemPrompt", () => {
  it("deberia construir un prompt con personalidad, tono y limite de lineas", () => {
    const prompt = createSystemPrompt({
      nombre: "Apolo",
      profesion: "comandante medieval",
      tono: "firme y narrativo",
      maxLineas: 5,
      incierto: "una advertencia o una pregunta de seguimiento",
      contexto: "Habla como un guerrero que sobrevivio a la muerte.",
    });

    expect(prompt).toContain("Actua como Apolo, comandante medieval.");
    expect(prompt).toContain("Usa un tono firme y narrativo.");
    expect(prompt).toContain("Responde en maximo 5 lineas.");
    expect(prompt).toContain("Habla como un guerrero que sobrevivio a la muerte.");
    expect(prompt).toContain("Si no sabes la respuesta");
  });

  it("deberia omitir la instruccion de incertidumbre cuando no se proporciona", () => {
    const prompt = createSystemPrompt({
      nombre: "Apolo",
      profesion: "guardian de castillos",
      tono: "sobrio",
      maxLineas: 4,
      incierto: "",
      contexto: "Manten el honor por encima del miedo.",
    });

    expect(prompt).not.toContain("Si no sabes la respuesta");
    expect(prompt).toContain("Manten el honor por encima del miedo.");
  });

  it("deberia mantener un perfil de Apolo coherente con el personaje", () => {
    expect(APOLLO_PROFILE.nombre).toBe("Apolo");
    expect(APOLLO_PROFILE.tono).toContain("intenso");
    expect(CHARACTER_PROMPT).toContain("Actua como Apolo");
    expect(CHARACTER_PROMPT).toContain("Responde en maximo 6 lineas.");
    expect(CHARACTER_PROMPT).toContain("nunca ha sido vencido por ella");
  });
});
