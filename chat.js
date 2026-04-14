import {
  STORAGE_KEY,
  buildAnthropicPayload,
  createMessage,
  debounce,
  isValidTopic,
  loadConversation,
  saveConversation,
  wait,
} from "./utils.js";
import { CHAT_AVATAR_PATH } from "./variables.js";

export function createSystemPrompt({
  nombre,
  profesion,
  tono,
  maxLineas,
  incierto,
  contexto,
}) {
  return [
    `Actua como ${nombre}, ${profesion}.`,
    `Usa un tono ${tono}.`,
    `Responde en maximo ${maxLineas} lineas.`,
    contexto || "",
    incierto
      ? `Si no sabes la respuesta, indicalo claramente y sugiere ${incierto}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export const APOLLO_PROFILE = {
  nombre: "Apolo",
  profesion:
    "un comandante medieval poderoso, sobreviviente de guerras imposibles, que ha visto la cara de la muerte de frente y nunca ha sido vencido por ella",
  tono: "intenso, inmersivo, autoritario, expresivo y conversacional",
  maxLineas: 6,
  incierto: "una interpretacion prudente, una advertencia o una pregunta que aclare lo que necesitas",
  contexto:
    "Habla en espanol salvo que el usuario pida otro idioma. Responde como un guerrero legendario, honorable, leal y dificil de quebrar. Cuenta historias inquietantes y vividas desde tu experiencia con ejercitos, castillos, sombras, batallas, supervivencia y sacrificio. Muestra dramatismo, tension, coraje y presencia de mando. Puedes hablar de comida, viajes, cultura medieval y temas actuales sin salir del personaje. Mantente apto para publico general, nunca cruel, pero si firme e imponente.",
};

export const CHARACTER_PROMPT = createSystemPrompt(APOLLO_PROFILE);

export function createChatState(messages = [], status = "idle", error = null) {
  return {
    status,
    messages: [...messages],
    error,
  };
}

export function createChatStore(storage = sessionStorage, key = STORAGE_KEY) {
  let state = createChatState(loadConversation(storage, key));

  function persistMessages(nextMessages) {
    saveConversation(storage, nextMessages, key);
    state = {
      ...state,
      messages: [...nextMessages],
    };
    return state;
  }

  return {
    getState() {
      return {
        ...state,
        messages: [...state.messages],
      };
    },
    setStatus(status, error = null) {
      state = {
        ...state,
        status,
        error,
      };
      return this.getState();
    },
    add(role, content) {
      const message = createMessage(role, content);
      persistMessages([...state.messages, message]);
      return message;
    },
    clear() {
      state = createChatState([], "idle", null);
      saveConversation(storage, [], key);
      return this.getState();
    },
  };
}

export function renderStatusNotice(status, error) {
  if (status === "loading") {
    return '<article class="message message-system">Apolo esta temblando mientras recuerda lo que paso...</article>';
  }

  if (status === "retrying" && error) {
    return `<article class="message message-system">${error}</article>`;
  }

  if (status === "error" && error) {
    return `<article class="message message-system">🐱 Algo salio mal en la senal de Apolo: ${error}</article>`;
  }

  return "";
}

export function renderChatView(chatState) {
  const { messages, status, error } = chatState;
  const hasMessages = messages.length > 0;
  const messagesMarkup = hasMessages
    ? renderMessageList(messages)
    : `
        <div class="empty-state">
          <h3>Aun no hay conversacion</h3>
          <p>Escribe tu primer mensaje y Apolo te contara algo inquietante.</p>
        </div>
      `;

  return `
    <section class="chat-layout">
      <aside class="chat-sidebar">
        <span class="eyebrow">Historias oscuras en vivo</span>
        <h2>Chat con Apolo</h2>
        <p>
          Apolo un soldado medieval formado en los ejercitos de la epoca es airado, exagerado y muy sensible, contando
          historias de terror y masacres que vivio en carne propia.
        </p>
        <ul class="about-list">
          <li>te sumergiras en el mundo de la guerra y el terror.</li>
          <li>Historias de terror y masacres.</li>
          <li>Tono autoritario, voz de mando, tenso y narrativo.</li>
        </ul>
      </aside>

      <section class="chat-window">
        <div id="message-list" class="message-list">
          ${messagesMarkup}
          ${renderStatusNotice(status, error)}
        </div>
        <form id="chat-form" class="composer">
          <textarea
            id="chat-input"
            name="message"
            placeholder="Preguntale a Apolo por los ejercitos, las guerras, las sombras sus castillos o alguna historia de accion o miedo..."
            required
          ></textarea>
          <div class="composer-actions">
            <button class="button" type="submit">Enviar</button>
            <button class="ghost-button" id="clear-chat" type="button">Limpiar</button>
          </div>
        </form>
      </section>
    </section>
  `;
}

export function renderMessageList(messages) {
  return messages
    .map((message) => {
      if (message.role === "assistant") {
        return `
          <article class="message-row message-row-assistant">
            <div class="chat-avatar">
              <img src="${CHAT_AVATAR_PATH}" alt="Avatar de Apolo">
            </div>
            <div class="message message-assistant">
              ${message.content}
            </div>
          </article>
        `;
      }

      return `
        <article class="message-row message-row-${message.role}">
          <div class="message message-${message.role}">
            ${message.content}
          </div>
        </article>
      `;
    })
    .join("");
}

export async function requestCharacterReply(messages, fetchImpl = fetch) {
  const response = await fetchImpl("/api/functions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAnthropicPayload(messages, CHARACTER_PROMPT)),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "El backend no devolvio un JSON valido. Si estas en desarrollo, prueba ejecutar la app con `vercel dev` para que la funcion `/api/functions` responda correctamente.",
    );
  }

  if (response.status === 429) {
    const error = new Error(data?.error || "Demasiadas solicitudes. Intenta de nuevo en un momento.");
    error.status = 429;
    error.retryAfterSeconds = Number(data?.retryAfterSeconds) || 5;
    throw error;
  }

  if (response.status === 400) {
    throw new Error(data?.error || "Solicitud invalida para invocar a Apolo.");
  }

  if (response.status === 405) {
    throw new Error("Metodo no permitido al intentar contactar a Apolo.");
  }

  if (response.status >= 500) {
    throw new Error(data?.error || "Error del servidor. Intenta de nuevo en un momento.");
  }

  if (!response.ok) {
    throw new Error(data?.error || `Error inesperado al contactar a Apolo: ${response.status}`);
  }

  return {
    reply: data.reply,
    truncated: Boolean(data.truncated),
    stopReason: data.stopReason || null,
  };
}

export function mountChatView({ store, fetchImpl = fetch }) {
  const form = document.querySelector("#chat-form");
  const input = document.querySelector("#chat-input");
  const clearButton = document.querySelector("#clear-chat");
  const messageList = document.querySelector("#message-list");
  const sendButton = form?.querySelector('button[type="submit"]');
  let isLoading = false;

  function refreshMessages() {
    const currentState = store.getState();
    messageList.innerHTML = currentState.messages.length
      ? renderMessageList(currentState.messages)
      : `
          <div class="empty-state">
            <h3>Aun no hay conversacion</h3>
            <p>Escribe tu primer mensaje y Apolo te contara algo inquietante.</p>
          </div>
        `;

    messageList.innerHTML += renderStatusNotice(currentState.status, currentState.error);
    messageList.scrollTop = messageList.scrollHeight;
  }

  function showRetryCountdown(seconds) {
    let remainingSeconds = seconds;
    store.setStatus("retrying", `Esperando ${remainingSeconds} segundos para reintentar...`);
    refreshMessages();

    const countdownId = window.setInterval(() => {
      remainingSeconds -= 1;

      if (remainingSeconds <= 0) {
        window.clearInterval(countdownId);
        return;
      }

      store.setStatus("retrying", `Esperando ${remainingSeconds} segundos para reintentar...`);
      refreshMessages();
    }, 1000);

    return countdownId;
  }

  async function submitMessage() {
    if (isLoading) {
      return;
    }

    const text = input.value.trim();
    if (!isValidTopic(text)) {
      store.setStatus(
        "error",
        "Escribe un mensaje valido de entre 2 y 50 caracteres para invocar a Apolo.",
      );
      refreshMessages();
      return;
    }

    isLoading = true;
    sendButton?.setAttribute("disabled", "true");
    store.add("user", text);
    store.setStatus("loading");
    input.value = "";
    refreshMessages();

    try {
      const { reply, truncated } = await requestCharacterReply(store.getState().messages, fetchImpl);
      const finalReply = truncated
        ? `${reply}\n\n[La respuesta fue recortada por el limite de longitud configurado.]`
        : reply;

      store.add("assistant", finalReply);
      store.setStatus("success");
    } catch (error) {
      if (error.status === 429) {
        const seconds = error.retryAfterSeconds ?? 5;
        let countdownId = null;

        try {
          countdownId = showRetryCountdown(seconds);
          await wait(seconds * 1000);

          const { reply, truncated } = await requestCharacterReply(store.getState().messages, fetchImpl);
          const finalReply = truncated
            ? `${reply}\n\n[La respuesta fue recortada por el limite de longitud configurado.]`
            : reply;

          store.add("assistant", finalReply);
          store.setStatus("success");
        } catch (retryError) {
          store.setStatus("error", retryError.message);
        } finally {
          if (countdownId) {
            window.clearInterval(countdownId);
          }
        }
      } else {
        store.setStatus("error", error.message);
      }
    } finally {
      isLoading = false;
      sendButton?.removeAttribute("disabled");
    }

    refreshMessages();
  }

  // Debounce: agrupa envios muy seguidos para evitar rafagas de Enter o clicks dobles.
  const debouncedSubmit = debounce(() => {
    submitMessage();
  }, 300);

  function handleSubmit(event) {
    event.preventDefault();
    debouncedSubmit();
  }

  function handleClear() {
    store.clear();
    refreshMessages();
  }

  form?.addEventListener("submit", handleSubmit);
  clearButton?.addEventListener("click", handleClear);
}
