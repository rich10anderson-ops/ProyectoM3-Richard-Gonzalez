import { createChatStore, mountChatView, renderChatView } from "./chat.js";
import { normalizePath } from "./utils.js";
import { ABOUT_IMAGE_PATH, HERO_IMAGE_PATH } from "./variables.js";

export const ROUTES = {
  "/": { key: "home", label: "Inicio" },
  "/chat": { key: "chat", label: "Chat" },
  "/about": { key: "about", label: "Acerca de" },
};

export function getRoute(pathname) {
  const normalized = normalizePath(pathname);
  return ROUTES[normalized] || null;
}

export function renderView(pathname, state = {}) {
  const route = getRoute(pathname);

  if (!route) {
    return `
      <section class="panel">
        <span class="eyebrow">404</span>
        <h2>Page not found</h2>
        <p class="lead">The route you tried to open does not exist in this SPA.</p>
      </section>
    `;
  }

  if (route.key === "home") {
    return `
      <section class="hero">
        <aside class="hero-card hero-card-poster">
          <div class="hero-portrait-frame hero-portrait-frame-poster">
            <img
              class="hero-portrait hero-portrait-poster"
              src="${HERO_IMAGE_PATH}"
              alt="Apolo en una escena dramatica de accion"
            >
            <div class="hero-poster-overlay">
              <span class="eyebrow">Personaje principal</span>
              <h2>Apolo</h2>
              <p>
                Cada cicatriz tiene una historia. Cada sombra, un recuerdo que todavia lo persigue.
              </p>
            </div>
          </div>
        </aside>
        <article class="hero-copy">
          <span class="eyebrow">Apolo no te está esperando, ten cuidado</span>
          <p class="hero-kicker"> Le gusta estar solo cuando cae la noche.</p>
          <h1>Entra al chat pero no hagas ruido, se educado.</h1>
          <p class="lead">
            Una experiencia inquietante y directa, mano a mano para conversar con Apolo,
            un super Heroe que sobrevivió a noches llenas de batallas, guerra, injusticia y mucha oscuridad.
          </p>
          <div class="cta-row">
            <a href="/chat" class="button" data-link>Entrar al chat</a>
            <a href="/about" class="ghost-button" data-link>Conocer a Apolo</a>
          </div>
        </article>
      </section>
    `;
  }

  if (route.key === "chat") {
    return renderChatView(
      state.chatState || {
        status: "idle",
        error: null,
        messages: [],
      },
    );
  }

  return `
    <section class="about-grid">
      <article class="about-card about-card-photo">
        <span class="eyebrow">Retrato</span>
        <div class="apolo-mini-frame">
          <img
            class="apolo-mini-photo"
            src="${ABOUT_IMAGE_PATH}"
            alt="Retrato de Apolo en vuelo"
          >
        </div>
        <p class="muted">Una mirada cercana del guardian que atraviesa las oscuridades del mundo.</p>
      </article>
      <article class="about-card">
        <span class="eyebrow">Apolo</span>
        <h2>Un sobreviviente del caos</h2>
        <p>
          Apolo interpreta cada ruido como una amenaza y cada sombra como una presencia.
          Aun asi, siempre vuelve de entre las ruinas para contar lo que ocurrio.
        </p>
      </article>
      <article class="about-card">
        <span class="eyebrow">Personalidad</span>
        <h2> Honorable,Valiente, leal, expresivo</h2>
        <p>
          Su forma de expresarse y de hablar mezcla valor, ternura y dramatismo. Puede contar historias
          inquietantes desde su propia perspectiva, como si aun estuviera atrapado en ellas.
        </p>
      </article>
      <article class="about-card">
        <span class="eyebrow">Conversacion</span>
        <h2>Historias que cambian contigo</h2>
        <p>
          Cada mensaje puede abrir una nueva historia de lucha y filosofia, un recuerdo brutal de la guerra, como tambien una
          reaccion exagerada de Apolo frente a lo desconocido, frente a la oscuridad.
        </p>
      </article>
    </section>
  `;
}

export function renderShell(pathname, viewHtml) {
  const currentPath = normalizePath(pathname);
  const navItems = Object.entries(ROUTES)
    .map(
      ([path, route]) => `
        <a
          href="${path}"
          class="nav-link ${currentPath === path ? "is-active" : ""}"
          data-link
        >
          ${route.label}
        </a>
      `,
    )
    .join("");

  return `
    <div class="shell">
      <header class="topbar">
        <div class="topbar-inner">
          <a href="/" class="brand" data-link>Apolo</a>
          <nav class="nav" aria-label="Main navigation">${navItems}</nav>
        </div>
      </header>
      <main class="view">${viewHtml}</main>
    </div>
  `;
}

export function createRouter({
  root,
  store,
  fetchImpl = fetch,
  historyApi = globalThis.window?.history,
  locationApi = globalThis.window?.location,
  documentApi = globalThis.document,
  windowApi = globalThis.window,
}) {
  function render() {
    const path = normalizePath(locationApi?.pathname || "/");
    const view = renderView(path, { chatState: store.getState() });
    root.innerHTML = renderShell(path, view);

    if (path === "/chat") {
      mountChatView({ store, fetchImpl });
    }
  }

  function navigate(pathname) {
    const nextPath = normalizePath(pathname);
    historyApi.pushState({}, "", nextPath);
    render();
  }

  function handlePopState() {
    render();
  }

  function handleLinkClick(event) {
    const link = event.target.closest("[data-link]");
    if (!link) {
      return;
    }

    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) {
      return;
    }

    event.preventDefault();
    navigate(href);
  }

  return {
    init() {
      const initialPath = normalizePath(locationApi?.pathname || "/");
      historyApi?.replaceState?.({ path: initialPath }, "", initialPath);
      render();
      windowApi?.addEventListener("popstate", handlePopState);
      documentApi?.addEventListener("click", handleLinkClick);
    },
    destroy() {
      windowApi?.removeEventListener("popstate", handlePopState);
      documentApi?.removeEventListener("click", handleLinkClick);
    },
    navigate,
    handlePopState,
    render,
  };
}

const root = globalThis.document?.querySelector?.("#app");

if (root) {
  const store = createChatStore();
  const router = createRouter({ root, store });
  router.init();
}
