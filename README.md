# CF Analytics — Codeforces Weak Topic Finder

## Problem Statement

Competitive programmers improve fastest by targeting their weakest topics, but Codeforces gives no built-in view of which problem tags they struggle with. CF Analytics fills that gap.

## Target Users

Codeforces users (beginner → intermediate) who want data-driven practice instead of random problem-picking.

## Solution

Enter your Codeforces handle (case-insensitive). The app fetches your full submission history and rating history from the public Codeforces API, computes a **solve rate per tag**, and surfaces:

- An interactive **rating history** line chart
- A **tag bar chart** with the 3 weakest tags (and any tag under 50% solve rate) highlighted in red
- **5 unsolved problems** near your current rating from your weakest tag

Results are cached in MongoDB for 1 hour, so repeated queries are instant.

> **Note:** The `*special` tag is excluded from analytics — it is not a real topic category.
> Handles are normalised to lowercase, so "Tourist" and "tourist" share the same cached result.

---

## Key Features

| Feature              | Details                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| Rating history chart | Line chart of every contest rating change                                  |
| Tag analytics chart  | Solved vs Attempted per tag; 3 weakest tags (and <50%) highlighted in red  |
| Practice suggestions | 5 unsolved problems near your current rating from your weakest tag         |
| 1-hour MongoDB cache | Avoids hammering the Codeforces API                                        |
| Error handling       | Bad handle, API down, no data — all caught                                 |

---

## Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | React 18 + Vite, Recharts, Axios |
| Backend  | Node.js, Express 4               |
| Database | MongoDB Atlas (Mongoose)         |
| Data     | Codeforces public REST API       |
| Styling  | Plain CSS (custom dark theme)    |

---

## Architecture

```
Browser (React + Recharts)
        │  GET /api/analyze/:handle
        ▼
Express Server (Node)
  ├── Normalise handle (lowercase, URL-encode)
  ├── Check MongoDB cache (< 1 hr old) → return cached result
  ├── Fetch user.status  ─┐  parallel via Promise.all
  ├── Fetch user.rating  ─┘
  ├── Compute tag stats (attempted / solved / ratio), skip *special
  ├── Filter tags with < 3 attempts (noise guard)
  ├── Sort by ratio ascending (weakest first)
  ├── Fetch 5 unsolved problems near the user's rating for the weakest tag
  ├── Upsert result in MongoDB
  └── Return JSON to client
        │
        ▼
MongoDB Atlas — `analyses` collection
```

---

## Local Setup

### Prerequisites

- Node.js ≥ 18
- A free [MongoDB Atlas](https://cloud.mongodb.com) cluster

### 1. Clone & install

```bash
git clone <your-repo-url>
cd cf-analytics
npm run install:all   # installs both server and client deps
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# edit server/.env and paste your MongoDB Atlas connection string
```

### 3. Run

Open two terminals:

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

### Backend (`server/.env`)

| Variable    | Description                     |
| ----------- | ------------------------------- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT`      | Express port (default `5000`)   |

> ⚠️ Never commit `server/.env`. It is in `.gitignore`.

### Frontend (`client/.env` — optional)

| Variable       | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `VITE_API_URL` | Base URL of the backend when hosted on a different domain. Leave empty locally. |

---

## Deployment

- **Backend**: Deploy `server/` to [Render](https://render.com) (free tier). Set `MONGO_URI` and `PORT` as environment variables in the Render dashboard.
- **Frontend**: On [Vercel](https://vercel.com), set the environment variable `VITE_API_URL` to your Render backend URL (e.g. `https://cf-analytics-api.onrender.com`). Vercel uses this at build time. No proxy changes needed.

---

## Limitations and Future Work

**Current limitations:**

- **Solve rate is a simple proxy.** It does not account for problem difficulty or how many wrong attempts were made before a correct submission — a tag with many easy solves looks equally "strong" as one with hard solves.
- **Tags with few attempts are noisy.** A tag attempted only once or twice gives an unreliable ratio, which is why a minimum of 3 attempts is required before a tag appears in analytics.
- **Suggestion range widens automatically.** When a tag has very few unsolved problems near your rating, the rating window broadens — so occasionally a suggestion may be slightly outside your comfort zone.

**Future ideas:**

- Weight tag weakness by problem rating (penalise failing hard problems more than easy ones).
- Add a LeetCode view using the LeetCode GraphQL API.
- Compare your tag stats against other users or against a target rating bracket.

---

## API Reference

### `GET /api/analyze/:handle`

Returns analytics for a given Codeforces handle (case-insensitive).

**Response (200)**

```json
{
  "handle": "tourist",
  "cached": false,
  "fetchedAt": "2026-10-27T...",
  "ratingHistory": [ { "contestId": 1, "newRating": 1500, "ratingUpdateTimeSeconds": 1700000000 } ],
  "tagStats": [
    { "tag": "graphs", "attempted": 10, "solved": 3, "ratio": 0.3 }
  ],
  "suggestions": [
    { "name": "Problem A", "rating": 1200, "url": "https://codeforces.com/problemset/problem/123/A" }
  ]
}
```

**Error (400)**

```json
{ "error": "Human-readable message" }
```
