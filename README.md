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
3.  **AI Career Advisor Chat:** ChatGPT-style counselor workspace parsing the user's profile context dynamically to offer contextualized advising.
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
│   ├── package.json         # Client build registry
│   └── vite.config.js       # Bundler properties
└── README.md
```

---

## Setup & Running Locally

### Step 1: Clone the repository & setup backend
Navigate to `/backend` directory:
1.  Copy `.env.example` to `.env`.
2.  Provide your MongoDB URI (local fallback: `mongodb://127.0.0.1:27017/career-compass-ai`).
3.  Provide your `GEMINI_API_KEY` (obtainable from Google AI Studio).
    *   *Note: This key is required for the application to function. Ensure it is configured before starting the backend server.*
4.  Install dependencies:
    ```bash
    npm install
    ```
5.  Launch development server:
    ```bash
    npm run dev
    ```
    *(Starts on http://localhost:5000)*

### Step 2: Configure frontend client
Navigate to `/frontend` directory:
1.  Install packages:
    ```bash
    npm install
    ```
2.  Launch React client:
    ```bash
    npm run dev
    ```
    *(Starts on http://localhost:5173)*

---

## Database Model Schemas

Detailed descriptions of our collections (`users`, `chatHistory`, `careerPlans`, `roadmaps`, `resumeAnalysis`) can be found inside the respective Mongoose schema files in `backend/models/*.js`.

---

## API Documentation Highlights

### 1. Account Management (`/api/auth`)
*   `POST /signup` - Registers a user, returns JWT and Profile.
*   `POST /login` - Password verification, returns JWT.
*   `GET /profile` - Fetches authenticated user info.
*   `PUT /profile` - Updates skills, degree details, or goal statement.

### 2. Conversational Advisor (`/api/chat`)
*   `GET /sessions` - Fetches chat sessions listing.
*   `POST /sessions` - Instantiates new chatbot conversation.
*   `POST /sessions/:id/message` - Sends message to advisor, fetches replies with context injections.

### 3. Career Recommendations (`/api/career`)
*   `POST /recommendations` - Run profile against AI matches.
*   `POST /roadmap` - Build custom study timelines and course suggestions matching goal target.

### 4. Resume Scanners (`/api/resume`)
*   `POST /analyze` - Upload resume PDF via MultiPart, parse text content, score compatibility, list missing skills, compile suggestion list.
