# Career Compass AI

Career Compass AI is an intelligent, full-stack career guidance counselor chatbot web application. Built with a modern glassmorphic dark-mode interface, it helps students and young professionals align their skills, goals, and credentials with active hiring sectors.

---

## Technical Architecture Stack

*   **Frontend Client:** React 18, Vite, Tailwind CSS v3 (glassmorphic theme), Lucide icons, Framer Motion, and Recharts.
*   **Backend Server:** Node.js, Express, Mongoose ODM.
*   **Database:** MongoDB Atlas or local MongoDB instances.
*   **Cognitive Integrations:** Google Gemini (gemini-2.5-flash via @google/generative-ai), PDF Parser (`pdf-parse`) for resume parsing.

---

## Core Application Modules

1.  **JWT Authentication:** Fully protected API endpoints and route guards on the client for private directories.
2.  **Interactive Onboarding Profile:** Define qualifications, department, studies, target career, and tags representing interests or skills.
3.  **AI Career Advisor Chat:** Chat-style counselor workspace parsing the user's profile context dynamically to offer contextualized advising.
4.  **Role Match Engine:** Analyze student profiles and recommend top matching careers, expected salary benchmarks, and growth outlooks.
5.  **Interactive Learning Timelines:** 30/90/180-day vertical study roadmap checklists based on skill gaps.
6.  **Resource Curator:** Suggest online tutorials, certification courses, and YouTube learning paths.
7.  **ATS Resume Parser:** Upload a PDF resume to extract content, calculate compatibility scores, identify missing terms, and suggest structure upgrades.

---

## Directory Organization

```text
/
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB Mongoose configurations
│   ├── middleware/
│   │   └── auth.js          # JWT protection wrapper
│   ├── models/
│   │   ├── User.js          # Encrypted passwords and demographics
│   │   ├── ChatHistory.js   # Conversational message history
│   │   ├── CareerPlan.js    # AI recommended matching career lists
│   │   ├── Roadmap.js       # Curated study roadmaps & course paths
│   │   └── ResumeAnalysis.js# Parsed ATS records history
│   ├── routes/
│   │   ├── auth.js          # Signup, Login, and Profile updates
│   │   ├── chat.js          # Chatbot message query pipelines
│   │   ├── career.js        # Skill gaps and roadmap compilers
│   │   └── resume.js        # PDF parser and analyzer uploads
│   ├── .env.example         # System variables templates
│   ├── package.json         # Node services registry
│   └── server.js            # Express entry startup
├── frontend/
│   ├── src/
│   │   ├── components/      # UI Shell structures
│   │   ├── context/         # AuthContext and Axios defaults
│   │   ├── pages/           # Screen views (Dashboard, Advisor, etc.)
│   │   ├── App.jsx          # Route handlers
│   │   └── index.css        # Tailwind and Glassmorphism styles
│   ├── vercel.json          # SPA routing rewrites configuration
│   ├── .env.example         # Frontend env variables template
│   ├── package.json         # Client build registry
│   └── vite.config.js       # Bundler properties
└── README.md
```

---

## Environment Configuration

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```
*Note: In production, point `VITE_API_URL` to your hosted backend API URL.*

### Backend (`backend/.env`)
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/career-compass-ai
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

---

## Local Setup & Development

### Step 1: Backend Setup
1. Navigate to `/backend` directory.
2. Install packages:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your variables.
4. Launch development server:
   ```bash
   npm run dev
   ```
   *(Starts on http://localhost:5000)*

### Step 2: Frontend Setup
1. Navigate to `/frontend` directory.
2. Install packages:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure `VITE_API_URL`.
4. Launch React client:
   ```bash
   npm run dev
   ```
   *(Starts on http://localhost:5173)*

---

## Production Deployment Guide

### 1. MongoDB Atlas Configuration
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** and add an IP address. Whitelist `0.0.0.0/0` (allow access from anywhere) or obtain Render's outbound IP addresses.
3. Go to **Database Access** and create a user with read/write access.
4. Copy the connection string (format: `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/database_name`).

### 2. Google Gemini API Setup
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Create an API Key.
3. Configure `GEMINI_API_KEY` on your backend deployment.

### 3. Backend Deployment (Render)
1. Sign in to [Render](https://render.com/).
2. Create a new **Web Service** and connect your GitHub repository.
3. Set the following configurations:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add the following **Environment Variables**:
   - `MONGODB_URI` = *Your MongoDB Atlas connection string*
   - `JWT_SECRET` = *A strong random key*
   - `GEMINI_API_KEY` = *Your Google Gemini API key*
   - `CLIENT_URL` = *Your deployed Vercel frontend URL (e.g. `https://career-compass.vercel.app`)*
   - `PORT` = `5000` (Render will automatically allocate ports, but standardizing on 5000 or leaving it auto-assigned works fine)

### 4. Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com/).
2. Import your GitHub repository.
3. Set the following configurations:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = *Your deployed Render backend URL + `/api` (e.g., `https://career-compass-backend.onrender.com/api`)*
5. The included `vercel.json` ensures that all routing requests are fallback routed to `index.html`, eliminating 404 errors on browser page reloads.
