# Fictional Character Chat SPA

Single Page Application responsive para chatear con un personaje ficticio usando Google Gemini API a traves de una Vercel Serverless Function.

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

## Requisitos cubiertos

- Routing SPA con History API.
- Tres vistas principales: Home, Chat y About.
- Integracion de Google Gemini API desde `api/functions.js`.
- Historial de conversacion durante la sesion con `sessionStorage`.
- Minimo 4 tests unitarios con Vitest.
- Control explicito de temperatura y longitud maxima de respuesta.

## Variables de entorno

Usa `.env.example` como referencia:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_TOKENS=320  (Preferible por la calidad de personaje)
```

## Scripts

```bash
npm install
npm test
npm run dev
```

## Flujo general

1. `app.js` controla las rutas y renderiza cada vista.
2. `chat.js` administra el estado del chat y la llamada al backend.
3. `utils.js` concentra helpers reutilizables y persistencia.
4. `api/functions.js` habla con Gemini usando la API key del servidor.
5. El backend devuelve `reply`, `truncated` y `stopReason` para manejar respuestas recortadas.

## Nota de despliegue

Para desplegar en Vercel, asegurate de definir `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TEMPERATURE` y `GEMINI_MAX_TOKENS` en las Environment Variables del proyecto.
