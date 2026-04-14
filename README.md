# Fictional Character Chat SPA

Single Page Application responsive para chatear con un personaje ficticio usando Anthropic Messages API a traves de una Vercel Serverless Function.

## Estructura

```text
project-root/
|-- api/
|   `-- functions.js
|-- src/
|   |-- index.html
|   |-- styles.css
|   |-- app.js
|   |-- chat.js
|   `-- utils.js
|-- tests/
|   |-- utils.test.js
|   `-- app.test.js
|-- .env
|-- .env.example
|-- .gitignore
|-- package.json
`-- README.md
```

## Requisitos cubiertos

- Routing SPA con History API.
- Tres vistas principales: Home, Chat y About.
- Integracion de Anthropic Messages API desde `api/functions.js`.
- Historial de conversacion durante la sesion con `sessionStorage`.
- Minimo 4 tests unitarios con Vitest.
- Control explicito de temperatura y longitud maxima de respuesta.

## Variables de entorno

Usa `.env.example` como referencia:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
ANTHROPIC_TEMPERATURE=0.2
ANTHROPIC_MAX_TOKENS=120
ANTHROPIC_VERSION=2023-06-01
```

## Scripts

```bash
npm install
npm test
```

## Flujo general

1. `src/app.js` controla las rutas y renderiza cada vista.
2. `src/chat.js` administra el estado del chat y la llamada al backend.
3. `src/utils.js` concentra helpers reutilizables y persistencia.
4. `api/functions.js` habla con Anthropic usando la API key del servidor.
5. El backend devuelve `reply`, `truncated` y `stopReason` para manejar respuestas recortadas.

## Nota de despliegue

Para desplegar en Vercel, asegurate de definir `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_TEMPERATURE`, `ANTHROPIC_MAX_TOKENS` y `ANTHROPIC_VERSION` en las Environment Variables del proyecto.
