# CF Analytics — Codeforces Weak Topic Finder

A full-stack web application that analyzes a Codeforces user's submission history to identify weak problem-solving topics and recommend targeted practice problems.

## 🔗 Live Links

- **Live Application:** https://cf-analytics-umber.vercel.app
- **Backend API:** https://cf-analytics-yde2.onrender.com
- **GitHub Repository:** https://github.com/sejal25bcs10171-bit/cf-analytics

## 1. Problem Statement

Competitive programmers improve faster by focusing on their weakest topics. However, Codeforces does not directly provide a personalized overview of a user's topic-wise solving performance.

CF Analytics addresses this problem by analyzing submission history, calculating tag-wise solve rates, visualizing performance, and recommending relevant unsolved problems.

## 2. Target Users

Beginner and intermediate Codeforces users who want to improve their competitive programming skills through data-driven, targeted practice rather than random problem selection.

## 3. Key Features

- **Codeforces Profile Analysis:** Enter a Codeforces handle to analyze submission and contest rating history.
- **Rating History Visualization:** Interactive line chart displaying contest rating changes.
- **Tag-wise Performance Analytics:** Visualizes solved versus attempted problems for different tags.
- **Weak Topic Detection:** Highlights the weakest eligible tags using their solve rates.
- **Personalized Practice Suggestions:** Recommends unsolved problems near the user's current rating, prioritizing weak topics.
- **Progress Tracking:** Provides a Check Progress workflow to revisit performance information.
- **New Practice Set:** Provides a workflow to generate another set of practice suggestions.
- **MongoDB Caching:** Stores analysis results to reduce repeated Codeforces API requests.
- **Error Handling:** Handles invalid handles, unavailable API responses, and missing analysis data.

## 4. How It Works

1. The user enters a Codeforces handle.
2. The frontend sends a request to the Express backend.
3. The backend normalizes the handle and checks MongoDB for a cached analysis.
4. If a fresh cached result is unavailable, the backend fetches submission and contest rating data from the Codeforces public API.
5. The application calculates attempted problems, successful solves, and solve rates for each tag.
6. Tags with fewer than three attempts are excluded to reduce misleading results, and the `special` tag is excluded from topic analytics.
7. The weakest eligible tags are identified and used to prioritize unsolved practice problems.
8. The analysis is returned to the frontend, visualized in charts, and cached in MongoDB.

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Charts | Recharts |
| HTTP Requests | Axios |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| External Data | Codeforces Public REST API |
| Styling | Custom CSS |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

## 6. Architecture

```text
User
  |
  v
React + Vite Frontend
  |
  | GET /api/analyze/:handle
  v
Node.js + Express Backend
  |
  +--> Normalize Codeforces handle
  |
  +--> Check MongoDB cache
  |       |
  |       +--> Return cached analysis if fresh
  |
  +--> Fetch submission and rating history
  |       from Codeforces API
  |
  +--> Calculate tag-wise statistics
  |
  +--> Identify weak topics
  |
  +--> Generate practice suggestions
  |
  +--> Store analysis in MongoDB
  |
  v
Return JSON response to frontend
  |
  v
Charts, Recommendations and Practice Workflow
```

## 7. Local Setup

### Prerequisites

- Node.js 18 or later
- npm
- A MongoDB Atlas cluster and connection string

### Step 1: Clone the Repository

```bash
git clone https://github.com/sejal25bcs10171-bit/cf-analytics.git
cd cf-analytics
npm run install:all
```

### Step 2: Configure Environment Variables

Create the backend environment file using the provided example:

```bash
cp server/.env.example server/.env
```

Configure the following variables in `server/.env`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000
```

Use the port expected by your server configuration if it differs from the example.

If needed, configure `client/.env` with:

```env
VITE_API_URL=http://localhost:5000
```

The frontend's API URL must match the backend address and port.

### Step 3: Start the Application

Open two terminals.

**Terminal 1 — Backend**

```bash
cd server
npm run dev
```

**Terminal 2 — Frontend**

```bash
cd client
npm run dev
```

Open the local frontend URL shown by Vite, usually http://localhost:5173.

## 8. Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT` | Port used by the Express server |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

Never commit environment files containing secrets or database credentials. Keep `.env` files excluded through `.gitignore`.

## 9. Deployment

### Frontend — Vercel

The frontend is deployed on Vercel.

- Live URL: https://cf-analytics-umber.vercel.app
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://cf-analytics-yde2.onrender.com`

### Backend — Render

The backend is deployed on Render.

- Base URL: https://cf-analytics-yde2.onrender.com
- Configure `MONGO_URI` through the Render environment settings.
- Configure any required server port according to the deployment environment.

### Database — MongoDB Atlas

MongoDB Atlas stores cached analysis results to reduce unnecessary external API calls.

## 10. Limitations and Future Improvements

### Current Limitations

- **Solve rate is an approximation:** It does not fully account for problem difficulty or the sequence of incorrect submissions before a successful solve.
- **Small sample sizes can be misleading:** Tags with fewer than three attempts are excluded from analytics.
- **Practice suggestions depend on available problems:** The number and difficulty of suitable suggestions depend on the available Codeforces problem data.
- **External API dependency:** Analysis may be affected by Codeforces API availability and backend response times.

### Future Improvements

- Incorporate problem difficulty into weakness calculations.
- Add historical comparisons to show improvement in individual tags.
- Compare performance with users in similar rating brackets.
- Introduce additional competitive programming platforms where supported APIs are available.
- Improve practice recommendations using learning history and previously completed suggestions.

## 11. API Reference

### Analyze a Codeforces Handle

`GET /api/analyze/:handle`

Returns analysis data for the supplied Codeforces handle.

Example request:

```http
GET https://cf-analytics-yde2.onrender.com/api/analyze/tourist
```

A successful response contains analysis information such as the handle, cache status, rating history, tag statistics, and practice suggestions, according to the backend response structure.

### Error Responses

The API returns an error response when a request cannot be processed. For example:

```json
{
  "error": "Human-readable error message"
}
```

The exact HTTP status and error message depend on the failure.

## 12. Project Outcomes

CF Analytics demonstrates the integration of a React frontend, a REST API backend, external API data retrieval, analytical logic, database caching, interactive data visualization, and cloud deployment.

The project turns raw competitive programming activity into actionable insights that help users decide what to practice next.

---

**Developer:** Sejal Pednekar  
**Project:** CF Analytics — Codeforces Weak Topic Finder
