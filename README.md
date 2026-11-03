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

Edit `public/config.js` and set `BUDGET_TRACKER_API_BASE` to the backend origin (without a trailing `/api`), for example:

```js
window.BUDGET_TRACKER_API_BASE = 'https://your-backend.example.com';
```

The app appends `/api` automatically. An empty value uses a same-origin `/api` path, suitable when a reverse proxy serves the API under the frontend domain.

The backend must allow the frontend's exact origin in its `FRONTEND_ORIGINS` environment variable. See the backend repository README for API setup and deployment.

## Run locally

The local project layout keeps the frontend and backend as separate repositories:

```text
budget tracker on MERN/
├── public/       # Frontend files
├── backend/      # Backend repository
├── package.json  # Starts both local services
└── README.md
```

Requirements: Node.js/npm, Python (the Windows `py` launcher), and a configured MongoDB connection in `backend/.env`.

From the project root, install the root development tool once and start both services:

```powershell
npm install
npm start
```

Open the frontend at `http://localhost:5500`. The backend API runs at `http://localhost:3000`; `http://localhost:3000/api` lists its endpoints. Keep the terminal running while using the app and press `Ctrl+C` to stop both services.

To run either service separately, use two terminals from the project root:

```powershell
npm run start:backend
npm run start:frontend
```

The frontend API origin is configured in `public/config.js` (defaults to `http://localhost:3000`). The backend must allow `http://localhost:5500` in `FRONTEND_ORIGINS`.

## Repository description

Responsive frontend for a personal budget tracker with transaction management and Google Gemini AI financial insights.
