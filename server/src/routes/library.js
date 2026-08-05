import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import User from '../models/User.js'
import Playlist from '../models/Playlist.js'

const router = Router()
router.use(requireAuth)

router.get('/favorites', async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ tracks: user.favorites })
})

router.post('/favorites/:trackId', async (req, res) => {
  const track = req.body || {}
  const user = await User.findById(req.user._id)
  if (!track.id) return res.status(400).json({ error: 'Track data required' })
  if (!user.favorites.some((t) => t.id === String(track.id))) user.favorites.push(track)
  await user.save()
  res.json({ tracks: user.favorites })
})

router.delete('/favorites/:trackId', async (req, res) => {
  const user = await User.findById(req.user._id)
  user.favorites = user.favorites.filter((t) => t.id !== String(req.params.trackId))
  await user.save()
  res.json({ tracks: user.favorites })
})

router.get('/playlists', async (req, res) => {
  const playlists = await Playlist.find({ user: req.user._id }).sort({ updatedAt: -1 })
  res.json({ playlists })
})

router.post('/playlists', async (req, res) => {
  const name = (req.body || {}).name
  if (!name || !name.trim()) return res.status(400).json({ error: 'Playlist name required' })
  const playlist = await Playlist.create({ name: name.trim(), user: req.user._id, tracks: [] })
  res.status(201).json({ playlist })
})

router.get('/playlists/:id', async (req, res) => {
  const playlist = await Playlist.findOne({ _id: req.params.id, user: req.user._id })
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' })
  res.json({ playlist })
})

router.post('/playlists/:id/tracks', async (req, res) => {
  const track = req.body || {}
  if (!track.id) return res.status(400).json({ error: 'Track data required' })
  const playlist = await Playlist.findOne({ _id: req.params.id, user: req.user._id })
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' })
  if (!playlist.tracks.some((t) => t.id === String(track.id))) playlist.tracks.push(track)
  await playlist.save()
  res.json({ playlist })
})

router.delete('/playlists/:id/tracks/:trackId', async (req, res) => {
  const playlist = await Playlist.findOne({ _id: req.params.id, user: req.user._id })
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' })
  playlist.tracks = playlist.tracks.filter((t) => t.id !== String(req.params.trackId))
  await playlist.save()
  res.json({ playlist })
})

router.delete('/playlists/:id', async (req, res) => {
  const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, user: req.user._id })
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' })
  res.json({ ok: true })
})

export default router
