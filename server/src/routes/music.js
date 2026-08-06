import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  searchMusic,
  getAlbum,
  getCharts,
  resolveChartTrack,
  resolveFullTrack,
  getRecent,
  getArtistSongs,
  getMoods,
  searchJamendo,
  getLyrics,
  getArtist,
  getSimilar,
  getTrack,
  getDaily,
} from '../utils/musicApi.js'

const router = Router()

const COUNTRIES = {
  IN: 'India',
  PK: 'Pakistan',
  US: 'USA',
  GB: 'UK',
  JP: 'Japan',
  KR: 'South Korea',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  TR: 'Turkey',
  AE: 'UAE',
  NG: 'Nigeria',
  ID: 'Indonesia',
}

router.get('/countries', (req, res) => {
  res.json(COUNTRIES)
})

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'Missing query ?q=' })
  try {
    const tracks = await searchMusic(q, req.query.country || 'IN', Number(req.query.limit) || 25)
    res.json({ tracks })
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach music service', detail: err.message })
  }
})

router.get('/charts', async (req, res) => {
  const country = String(req.query.country || 'US').toUpperCase()
  const limit = Number(req.query.limit) || 20
  try {
    let tracks = await getCharts(country, limit)
    tracks = await Promise.all(tracks.map(resolveChartTrack))
    tracks = tracks.filter((t) => t.previewUrl)
    res.json({ country, name: COUNTRIES[country] || country, tracks })
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach music service', detail: err.message })
  }
})

router.get('/album/:collectionId', async (req, res) => {
  try {
    const album = await getAlbum(req.params.collectionId)
    res.json(album)
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach music service', detail: err.message })
  }
})

router.get('/recent', async (req, res) => {
  try {
    const tracks = await getRecent(Number(req.query.limit) || 20)
    res.json({ tracks })
  } catch (err) {
    res.status(502).json({ error: 'Failed to load recent music', detail: err.message })
  }
})

router.get('/moods', async (req, res) => {
  try {
    const moods = await getMoods()
    res.json({ moods })
  } catch (err) {
    res.status(502).json({ error: 'Failed to load moods', detail: err.message })
  }
})

router.get('/artist-songs', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'Missing query ?q=' })
  try {
    const tracks = await getArtistSongs(q)
    res.json({ tracks })
  } catch (err) {
    res.status(502).json({ error: 'Failed to load artist songs', detail: err.message })
  }
})

router.get('/jamendo', async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.status(400).json({ error: 'Missing query ?q=' })
  try {
    const data = await searchJamendo(q, Number(req.query.limit) || 24)
    if (!data.enabled) return res.json({ enabled: false, tracks: [] })
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: 'Failed to load Jamendo', detail: err.message })
  }
})

router.get('/artist/:id', async (req, res) => {
  try {
    const artist = await getArtist(req.params.id)
    res.json(artist)
  } catch (err) {
    res.status(502).json({ error: 'Failed to load artist', detail: err.message })
  }
})

router.get('/lyrics', async (req, res) => {
  const title = (req.query.title || '').trim()
  const artist = (req.query.artist || '').trim()
  if (!title) return res.status(400).json({ error: 'Missing ?title=' })
  try {
    const lyrics = await getLyrics(title, artist)
    res.json({ lyrics })
  } catch (err) {
    res.status(502).json({ error: 'Failed to load lyrics', detail: err.message })
  }
})

router.get('/similar', async (req, res) => {
  const title = (req.query.title || '').trim()
  const artist = (req.query.artist || '').trim()
  if (!title) return res.status(400).json({ error: 'Missing ?title=' })
  try {
    const tracks = await getSimilar(title, artist)
    res.json({ tracks })
  } catch (err) {
    res.status(502).json({ error: 'Failed to load similar tracks', detail: err.message })
  }
})

router.get('/daily', requireAuth, async (req, res) => {
  try {
    const tracks = await getDaily(req.authId)
    res.json({ tracks })
  } catch (err) {
    res.status(502).json({ error: 'Failed to load daily mix', detail: err.message })
  }
})

router.get('/track/:id', async (req, res) => {
  try {
    const track = await getTrack(req.params.id)
    if (!track) return res.status(404).json({ error: 'Track not found' })
    res.json({ track })
  } catch (err) {
    res.status(502).json({ error: 'Failed to load track', detail: err.message })
  }
})

router.post('/full', async (req, res) => {
  const { title, artist } = req.body || {}
  if (!title) return res.status(400).json({ error: 'title required' })
  try {
    const result = await resolveFullTrack(title, artist || '')
    if (!result || result.error) {
      const detail = result?.error || 'unknown'
      console.warn('[FULL] failed:', detail)
      return res.status(404).json({ error: 'Could not resolve full track', detail })
    }
    if (result.youtubeId) return res.json({ youtubeId: result.youtubeId })
    res.json({ url: result.url })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

export default router
