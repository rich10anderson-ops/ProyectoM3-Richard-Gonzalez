# Fictional Character Chat SPA

Single Page Application responsive para chatear con un personaje ficticio usando Google Gemini API a traves de una Vercel Serverless Function.

## Vista general

| Indicador | Estado |
|---|---|
| Routing SPA | History API con `pushState` y `popstate` |
| UI responsive | Mobile-first con 3 breakpoints |
| Chat IA | Gemini 2.5 Flash |
| Persistencia | `sessionStorage` |
| Estados visuales | loading, retry, error, truncado |
| Tests | `11/11` en verde |

## Flujo de la app

```text
Usuario
  |
  v
Lobby SPA -> Router -> Vista Home / Chat / About
                    |
                    v
               Chat con Apolo
                    |
                    v
          requestCharacterReply()
                    |
                    v
             /api/functions
                    |
                    v
           Google Gemini API
                    |
                    v
      reply + stopReason + truncated
                    |
                    v
         Render del mensaje en UI
```

## Flujo del chat

```text
Input del usuario
  -> validacion de longitud
  -> debounce
  -> bloqueo por isLoading
  -> guardado en historial
  -> request al backend
  -> parseo de respuesta
  -> render de Apolo
  -> scroll automatico
```

## Estructura

```text
project-root/
|-- api/
|   `-- functions.js
|-- public/
|   |-- apolo-hero.png
|   |-- apolo-about.png
|   `-- apolo-chat.png
|-- tests/
|   |-- utils.test.js
|   `-- app.test.js
|-- .env
|-- .env.example
|-- app.js
|-- chat.js
|-- index.html
|-- styles.css
|-- utils.js
|-- variables.js
|-- package.json
`-- README.md
```

## Variables de entorno

Usa `.env.example` como referencia:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_TOKENS=520
```

## Scripts

```bash
npm install
npm test
npm run dev
npx vercel dev
```

## Nota de uso

- `npm run dev` sirve bien la SPA.
- `npx vercel dev` es la forma mas confiable de probar la SPA junto con `api/functions`.
- Si Apolo sigue saliendo recortado, sube `GEMINI_MAX_TOKENS` en tu `.env` real y reinicia el servidor.
