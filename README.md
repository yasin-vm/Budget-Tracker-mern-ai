# ⚡ AI-Powered MERN Budget Tracker & Financial Advisor

An intelligent, full-stack personal finance and budget tracking platform built on Node.js, Express, MongoDB, and Google Gemini AI.

---

## 🌟 Key Features

### 🧠 1. AI-Powered Natural Language Transaction Logging
- Log expenses or earnings by typing sentences naturally (e.g., *"Spent ₹650 on petrol at Shell"*, *"Received ₹45,000 monthly salary"*).
- The AI automatically extracts the **amount**, **transaction type (income/expense)**, **category**, and **clean description**.
- Supports direct auto-logging to MongoDB or previewing before saving.

### 📊 2. AI Financial Diagnostics & Spending Insights
- Generates an automated **Financial Health Score (1–100)**.
- Compares real-time spending against the user's `budgetLimit`.
- Identifies highest-spending categories and unusual spikes.
- Delivers personalized, actionable recommendations and month-end forecasts.

### 💬 3. Context-Aware AI Financial Assistant
- An interactive chatbot with real-time access to the user's financial profile, category breakdown, and transaction history.
- Ask questions like:
  - *"How much did I spend on food this month?"*
  - *"Can I afford an ₹8,000 gadget right now?"*
  - *"What are 3 ways I can cut down my expenses?"*

### 🛡️ 4. Dual-Engine Architecture (Resilient Fallback)
- **Primary Engine**: Google Gemini API (`@google/genai`).
- **Offline / Fallback Engine**: Built-in rule-based NLP parser and statistical advisor. If no API key is provided or network is offline, the app continues to function seamlessly without crashing.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on port `27017` (or MongoDB Atlas connection string)

### 2. Environment Setup
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/test
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note**: If `GEMINI_API_KEY` is omitted, the app will automatically use the built-in rule-based NLP fallback engine!

### 3. Install & Start
```bash
npm install
npm start
```
On first startup, the app seeds an Administrator account if one does not already exist:

- Username: `admin`
- Password: `Password123!`

Sign in at **`http://localhost:3000`** and use the Sign Up tab to create additional accounts. Passwords are stored as scrypt hashes and authenticated sessions are persisted in MongoDB; the browser keeps the session token in local storage. The default credentials are intended for local development and should not be exposed on a public deployment.

Visit **`http://localhost:3000`** in your browser to open the interactive UI dashboard!

---

## 📡 AI API Reference

Sign up with `POST /api/signup` or sign in with `POST /api/login`. Both return a session token. Send it on protected profile, transaction, and AI requests using `Authorization: Bearer <token>`. Use `POST /api/logout` to revoke the current session.

The browser sends the signed-in user's ID with AI requests for context; the API binds data access and writes to the authenticated session user.

### 1. Parse Natural Language Text
- **Endpoint**: `POST /api/ai/parse`
- **Body**:
  ```json
  {
    "userId": "<signed-in-user-id>",
    "text": "Paid 450 for Domino's pizza yesterday"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "amount": 450,
      "type": "expense",
      "category": "Food",
      "description": "Domino's pizza",
      "date": "2026-11-03T...",
      "source": "gemini-ai"
    }
  }
  ```

### 2. Auto-Log Transaction via AI
- **Endpoint**: `POST /api/ai/auto-log`
- **Body**:
  ```json
  {
    "userId": "<signed-in-user-id>",
    "text": "Received 50000 salary from tech job"
  }
  ```

### 3. Generate Spending Insights
- **Endpoint**: `POST /api/ai/insights`
- **Body**:
  ```json
  {
    "userId": "<signed-in-user-id>"
  }
  ```
- **Response**:
  Returns health score, category breakdown, budget utilization percentage, priority alerts, and personalized saving tips.

### 4. Financial Assistant Chat
- **Endpoint**: `POST /api/ai/chat`
- **Body**:
  ```json
  {
    "userId": "<signed-in-user-id>",
    "message": "Can I afford to spend 5000 on shoes?",
    "history": []
  }
  ```

---

## 💼 Interview Talking Points

When presenting this project in technical interviews, highlight:
1. **System Resilience**: Implemented a dual-engine pattern where Google Gemini handles complex natural language reasoning, with an intelligent rule-based fallback ensuring zero downtime if third-party APIs fail.
2. **Context-Engineered RAG-Lite Pattern**: Injected user-specific financial constraints (`budgetLimit`, current monthly velocity, categorical breakdowns) dynamically into the LLM system prompt for grounded, hallucination-free advice.
3. **MERN Integration**: Express middleware, Mongoose schema modeling with relational references between `users` and `transactions`, and RESTful API best practices.
