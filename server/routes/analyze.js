const express = require('express');
const axios = require('axios');
const Analysis = require('../models/Analysis');

const router = express.Router();

const CF_BASE = 'https://codeforces.com/api';
const CACHE_TTL_MS = 60 * 60 * 1000;
const MIN_ATTEMPTED = 3;

// ── handle validation ─────────────────────────────────────────────────────────
const HANDLE_RE = /^[a-z0-9._-]{3,24}$/;

// ── shared helper: problem key ────────────────────────────────────────────────
const problemKey = (contestId, index) => `${contestId}-${index}`;

// ── typed error so the route can choose the right HTTP status ─────────────────
class CFError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ── fetch helper ──────────────────────────────────────────────────────────────
async function fetchFromCF(url) {
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    if (data.status !== 'OK') {
      throw new CFError(data.comment || 'Codeforces API returned a non-OK status.', 400);
    }
    return data.result;
  } catch (err) {
    if (err instanceof CFError) throw err;
    if (err.response) {
      const comment = err.response.data?.comment;
      if (comment) {
        // CF returns HTTP 400 with "handle: User with handle X not found"
        const code = comment.startsWith('handle:') ? 404 : 400;
        throw new CFError(`Codeforces: ${comment}`, code);
      }
      throw new CFError(`Codeforces: HTTP ${err.response.status}`, 502);
    }
    // Network failure, timeout, DNS, etc.
    throw new CFError(`Codeforces API unreachable: ${err.message}`, 502);
  }
}

// ── tag stats ─────────────────────────────────────────────────────────────────
function buildTagStats(submissions) {
  const tagMap = {};

  for (const sub of submissions) {
    const problem = sub.problem;
    if (!problem?.tags?.length) continue;

    const key = problemKey(problem.contestId, problem.index);

    for (const tag of problem.tags) {
      if (tag.startsWith('*')) continue; // skip *special and similar
      if (!tagMap[tag]) tagMap[tag] = { attempted: new Set(), solved: new Set() };
      tagMap[tag].attempted.add(key);
      if (sub.verdict === 'OK') tagMap[tag].solved.add(key);
    }
  }

  return Object.entries(tagMap)
    .map(([tag, { attempted, solved }]) => ({
      tag,
      attempted: attempted.size,
      solved: solved.size,
      ratio: solved.size / attempted.size,
    }))
    .filter(s => s.attempted >= MIN_ATTEMPTED)
    .sort((a, b) => a.ratio - b.ratio);
}

// ── solved set ────────────────────────────────────────────────────────────────
function buildSolvedSet(submissions) {
  const solved = new Set();
  for (const sub of submissions) {
    if (sub.verdict === 'OK' && sub.problem?.contestId && sub.problem?.index) {
      solved.add(problemKey(sub.problem.contestId, sub.problem.index));
    }
  }
  return solved;
}

// ── practice suggestions ──────────────────────────────────────────────────────
async function fetchSuggestions(weakestTag, solvedSet, userRating) {
  try {
    const base = userRating || 900;
    const result = await fetchFromCF(
      `${CF_BASE}/problemset.problems?tags=${encodeURIComponent(weakestTag)}`
    );
    const problems = result.problems || [];

    const unsolved = problems.filter(p =>
      p.rating && !solvedSet.has(problemKey(p.contestId, p.index))
    );

    let candidates = unsolved.filter(
      p => p.rating >= base - 100 && p.rating <= base + 300
    );
    if (candidates.length < 5) {
      candidates = unsolved.filter(
        p => p.rating >= base - 300 && p.rating <= base + 500
      );
    }

    const target = base + 100;
    return candidates
      .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target))
      .slice(0, 5)
      .sort((a, b) => a.rating - b.rating)
      .map(p => ({
        id: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags,
        url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      }));
  } catch {
    return [];
  }
}

// ── route ─────────────────────────────────────────────────────────────────────
router.get('/:handle', async (req, res) => {
  const handle = req.params.handle.trim().toLowerCase();

  if (!handle) {
    return res.status(400).json({ error: 'Handle is required.' });
  }
  if (!HANDLE_RE.test(handle)) {
    return res.status(400).json({
      error: 'Invalid handle. Handles are 3–24 characters: letters, digits, underscore, hyphen, or dot.',
    });
  }

  try {
    // ── cache check ──
    const cached = await Analysis.findOne({ handle });
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
      return res.json({ ...cached.toObject(), cached: true });
    }

    const encodedHandle = encodeURIComponent(handle);

    const [submissions, ratingHistory] = await Promise.all([
      fetchFromCF(`${CF_BASE}/user.status?handle=${encodedHandle}&from=1&count=10000`),
      fetchFromCF(`${CF_BASE}/user.rating?handle=${encodedHandle}`),
    ]);

    const tagStats = buildTagStats(submissions);

    if (tagStats.length === 0) {
      return res.status(400).json({
        error: 'Not enough submission data. Solve more problems across at least 3 attempts per tag.',
      });
    }

    const solvedSet = buildSolvedSet(submissions);
    const lastRating = ratingHistory.length
      ? ratingHistory[ratingHistory.length - 1].newRating
      : null;

    const suggestions = await fetchSuggestions(tagStats[0].tag, solvedSet, lastRating);

    const doc = await Analysis.findOneAndUpdate(
      { handle },
      { handle, fetchedAt: new Date(), ratingHistory, tagStats, suggestions },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ ...doc.toObject(), cached: false });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
});

module.exports = router;
