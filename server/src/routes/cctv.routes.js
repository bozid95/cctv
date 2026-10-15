const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const axios = require("axios");

// Load dataset into memory
let dataset = { sources: {}, cams: [] };
try {
  const dataPath = path.join(__dirname, "../data/cctv-dataset.json");
  if (fs.existsSync(dataPath)) {
    dataset = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    console.log(`Loaded ${dataset.cams?.length || 0} CCTV cameras`);
  }
} catch (err) {
  console.error("Error reading CCTV dataset:", err.message);
}

/**
 * GET /api/cctv
 * Query params:
 *  - src: filter by source (e.g. 'dki', 'tol', 'bks')
 *  - q: search query by name or location
 *  - limit: number of results (default: all)
 */
router.get("/", (req, res) => {
  const { src, q, limit } = req.query;
  let results = dataset.cams || [];

  if (src && src !== "all") {
    results = results.filter((c) => c.src === src);
  }

  if (q) {
    const query = q.toLowerCase().trim();
    results = results.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.sub && c.sub.toLowerCase().includes(query)) ||
        (c.id && c.id.toLowerCase().includes(query)),
    );
  }

  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      results = results.slice(0, parsedLimit);
    }
  }

  res.json({
    total: results.length,
    sources: dataset.sources || {},
    checkedAt: dataset.checkedAt || new Date().toISOString(),
    cameras: results,
  });
});

/**
 * GET /api/cctv/sources
 * Returns all sources with count of cameras
 */
router.get("/sources", (req, res) => {
  const sources = dataset.sources || {};
  const counts = {};

  (dataset.cams || []).forEach((c) => {
    counts[c.src] = (counts[c.src] || 0) + 1;
  });

  const list = Object.keys(sources).map((key) => ({
    id: key,
    ...sources[key],
    count: counts[key] || 0,
  }));

  res.json({
    totalSources: list.length,
    totalCameras: dataset.cams?.length || 0,
    sources: list,
  });
});

/**
 * GET /api/cctv/live-token
 * Queries fresh HLS token for Jasa Marga toll cameras
 */
router.get("/live-token", async (req, res) => {
  const { r, n, v } = req.query;
  if (!r || !n || !v) {
    return res.status(400).json({ error: "Parameters r, n, and v are required" });
  }

  try {
    const qs = new URLSearchParams({ r, n, v, fresh: "1" }).toString();
    const response = await axios.get(`https://transit.oyenza.com/api/jmlive?${qs}`, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    res.json(response.data);
  } catch (err) {
    console.error("Failed to resolve live token:", err.message);
    res.status(500).json({ error: "Failed to resolve live token", message: err.message });
  }
});

/**
 * GET /api/cctv/:id
 * Get single camera detail
 */
router.get("/:id", (req, res) => {
  const cam = (dataset.cams || []).find((c) => c.id === req.params.id);
  if (!cam) {
    return res.status(404).json({ error: "CCTV camera not found" });
  }
  res.json(cam);
});

module.exports = router;
