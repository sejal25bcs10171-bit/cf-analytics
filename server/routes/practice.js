const express = require('express');
const axios = require('axios');
const PracticeSet = require('../models/PracticeSet');

const router = express.Router();
const CF_BASE = 'https://codeforces.com/api';

async function fetchSubmissions(handle) {
  const { data } = await axios.get(
    `${CF_BASE}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=500`,
    { timeout: 15000 }
  );
  if (data.status !== 'OK') throw new Error(data.comment || 'Codeforces error');
  return data.result;
}

// GET /api/practice/:handle — load current set (null if none)
router.get('/:handle', async (req, res) => {
  const handle = req.params.handle.trim().toLowerCase();
  try {
    const set = await PracticeSet.findOne({ handle });
    return res.json(set || null);
  } catch (err) {
    return res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// POST /api/practice/:handle — start (or replace) a practice set
router.post('/:handle', async (req, res) => {
  const handle = req.params.handle.trim().toLowerCase();
  const { problems, tag } = req.body;

  if (!Array.isArray(problems) || !problems.length || !tag) {
    return res.status(400).json({ error: 'problems (array) and tag are required.' });
  }

  try {
    const set = await PracticeSet.findOneAndUpdate(
      { handle },
      {
        handle,
        tag,
        startTime: new Date(),
        completionPct: 0,
        problems: problems.map(p => ({
          contestId: p.id,
          index: p.index,
          name: p.name,
          rating: p.rating,
          url: p.url,
          solved: false,
          solvedAt: null,
        })),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json(set);
  } catch (err) {
    return res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// POST /api/practice/:handle/check — verify progress against live CF submissions
router.post('/:handle/check', async (req, res) => {
  const handle = req.params.handle.trim().toLowerCase();

  try {
    const set = await PracticeSet.findOne({ handle });
    if (!set) return res.status(404).json({ error: 'No practice set found for this handle.' });

    const startTs = Math.floor(set.startTime.getTime() / 1000);

    let submissions;
    try {
      submissions = await fetchSubmissions(handle);
    } catch (err) {
      return res.status(502).json({ error: 'Could not reach Codeforces: ' + err.message });
    }

    // Build set of problems solved AFTER the practice set started
    const recentlySolved = new Set();
    for (const sub of submissions) {
      if (
        sub.verdict === 'OK' &&
        sub.creationTimeSeconds >= startTs &&
        sub.problem?.contestId &&
        sub.problem?.index
      ) {
        recentlySolved.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
    }

    // Update each problem's solved status
    let solvedCount = 0;
    set.problems = set.problems.map(p => {
      const obj = p.toObject();
      if (obj.solved) { solvedCount++; return obj; }
      const key = `${obj.contestId}-${obj.index}`;
      if (recentlySolved.has(key)) {
        solvedCount++;
        return { ...obj, solved: true, solvedAt: new Date() };
      }
      return obj;
    });

    set.completionPct = Math.round((solvedCount / set.problems.length) * 100);
    await set.save();

    return res.json(set);
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;

