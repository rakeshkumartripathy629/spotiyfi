import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import Playlist from "../models/Playlist.js";

const router = Router();
router.use(requireAuth);

const HISTORY_CAP = 200;

router.get("/favorites", async (req, res) => {
  const user = await User.findById(req.authId).select("favorites");
  res.json({ tracks: user?.favorites || [] });
});

router.post("/favorites/:trackId", async (req, res) => {
  const track = req.body || {};
  if (!track.id) return res.status(400).json({ error: "Track data required" });
  await User.findByIdAndUpdate(req.authId, {
    $pull: { favorites: { id: String(track.id) } },
  });
  const user = await User.findByIdAndUpdate(
    req.authId,
    { $push: { favorites: { $each: [track], $position: 0 } } },
    { new: true, select: "favorites" },
  );
  res.json({ tracks: user.favorites });
});

router.delete("/favorites/:trackId", async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.authId,
    { $pull: { favorites: { id: String(req.params.trackId) } } },
    { new: true, select: "favorites" },
  );
  res.json({ tracks: user.favorites });
});

router.get("/history", async (req, res) => {
  const user = await User.findById(req.authId).select("history");
  res.json({ tracks: user?.history || [] });
});

router.post("/history", async (req, res) => {
  const track = req.body || {};
  if (!track.id) return res.status(400).json({ error: "Track data required" });
  const entry = { ...track, listenedAt: new Date() };
  await User.findByIdAndUpdate(req.authId, {
    $pull: { history: { id: String(track.id) } },
  });
  const user = await User.findByIdAndUpdate(
    req.authId,
    { $push: { history: { $each: [entry], $slice: HISTORY_CAP } } },
    { new: true, select: "history" },
  );
  res.json({ tracks: user.history });
});

router.get("/recap", async (req, res) => {
  const user = await User.findById(req.authId).select("history");
  const history = user?.history || [];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = history.filter(
    (t) => t.listenedAt && new Date(t.listenedAt).getTime() >= weekAgo,
  );
  const count = (key) => {
    const m = {};
    week.forEach((t) => {
      const v = t[key];
      if (!v) return;
      m[v] = (m[v] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  };
  const dayCount = {};
  week.forEach((t) => {
    const d = new Date(t.listenedAt).toDateString();
    dayCount[d] = (dayCount[d] || 0) + 1;
  });
  const bestDay =
    Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const totalMinutes = Math.round(
    week.reduce((s, t) => s + (t.duration ? t.duration / 1000 / 60 : 0), 0),
  );
  res.json({
    week: {
      totalSongs: week.length,
      totalMinutes,
      topArtist: count("artist"),
      topTrack: count("title"),
      bestDay,
    },
  });
});

router.get("/playlists", async (req, res) => {
  const playlists = await Playlist.find({ user: req.authId }).sort({
    updatedAt: -1,
  });
  res.json({ playlists });
});

router.post("/playlists", async (req, res) => {
  const name = (req.body || {}).name;
  if (!name || !name.trim())
    return res.status(400).json({ error: "Playlist name required" });
  if (String(name).trim().length > 100)
    return res.status(400).json({ error: "Playlist name too long" });
  const playlist = await Playlist.create({
    name: name.trim(),
    user: req.authId,
    tracks: [],
  });
  res.status(201).json({ playlist });
});

router.get("/playlists/:id", async (req, res) => {
  const playlist = await Playlist.findOne({
    _id: req.params.id,
    user: req.authId,
  });
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });
  res.json({ playlist });
});

router.post("/playlists/:id/tracks", async (req, res) => {
  const track = req.body || {};
  if (!track.id) return res.status(400).json({ error: "Track data required" });
  const playlist = await Playlist.findOne({
    _id: req.params.id,
    user: req.authId,
  });
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });
  if (!playlist.tracks.some((t) => t.id === String(track.id)))
    playlist.tracks.push(track);
  await playlist.save();
  res.json({ playlist });
});

router.delete("/playlists/:id/tracks/:trackId", async (req, res) => {
  const playlist = await Playlist.findOne({
    _id: req.params.id,
    user: req.authId,
  });
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });
  playlist.tracks = playlist.tracks.filter(
    (t) => t.id !== String(req.params.trackId),
  );
  await playlist.save();
  res.json({ playlist });
});

router.delete("/playlists/:id", async (req, res) => {
  const playlist = await Playlist.findOneAndDelete({
    _id: req.params.id,
    user: req.authId,
  });
  if (!playlist) return res.status(404).json({ error: "Playlist not found" });
  res.json({ ok: true });
});

export default router;
