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

When the dashboard is served by the backend on port 3000, it uses the same origin for API calls, so no CORS configuration is needed. See the backend repository README if hosting the frontend separately.

## Run locally

The local project layout keeps the frontend and backend as separate repositories:

```text
budget tracker on MERN/
├── public/       # Frontend files
├── backend/      # Backend repository
├── package.json  # Starts both local services
└── README.md
```

Requirements: Git, Node.js/npm, and a MongoDB connection.

For a fresh checkout of this frontend repository, clone the separate backend repository into `backend/`:

```text
git clone https://github.com/yasin-vm/Budget-Tracker-mern-ai.git
cd "Budget-Tracker-mern-ai"
git clone https://github.com/yasin-vm/Budget-Tracker-ai-backend.git backend
```

In the project root, install the backend dependencies and configure `backend/.env` using its example file:

```powershell
npm --prefix backend install
Copy-Item backend/.env.example backend/.env
```

Set `MONGO_URI` in `backend/.env` and replace the blank `GEMINI_API_KEY` with your real Google AI Studio API key to enable Gemini features. A placeholder or blank key uses the offline AI fallback. The startup log reports whether a non-placeholder key was loaded. The `.env` file is local and must not be committed.

Start the dashboard and API together on port 3000:

```powershell
npm start
```

Open `http://localhost:3000` for the dashboard. The API endpoint index is at `http://localhost:3000/api`. Keep the terminal running while using the app and press `Ctrl+C` to stop the server. No separate frontend server is required.

## Repository description

Responsive frontend for a personal budget tracker with transaction management and Google Gemini AI financial insights.
