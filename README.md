# Budget Tracker Frontend

Responsive browser frontend for the Budget Tracker application. The Express/MongoDB API is maintained separately in [Budget-Tracker-ai-backend](https://github.com/yasin-vm/Budget-Tracker-ai-backend).

## Features

- Dashboard with income, expense, savings, and budget progress.
- Natural-language transaction quick add.
- AI financial insights and conversational advisor.
- Transaction search, category filter, edit, and delete.
- Profile and budget settings.
- Login/signup with persistent authenticated sessions.

## Connect to the backend

Edit `config.js` and set `BUDGET_TRACKER_API_BASE` to the backend origin (without a trailing `/api`), for example:

```js
window.BUDGET_TRACKER_API_BASE = 'https://your-backend.example.com';
```

The app appends `/api` automatically. An empty value uses a same-origin `/api` path, suitable when a reverse proxy serves the API under the frontend domain.

The backend must allow the frontend's exact origin in its `FRONTEND_ORIGINS` environment variable. See the backend repository README for API setup and deployment.

## Run locally

Serve this directory with any static file server, for example the VS Code Live Server extension on `http://localhost:5500`. Set the backend origin in `config.js` (typically `http://localhost:3000`) and allow `http://localhost:5500` in the backend CORS configuration.

No frontend build step or package installation is required.

## Repository description

Responsive frontend for a personal budget tracker with transaction management and Google Gemini AI financial insights.
