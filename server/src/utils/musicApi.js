import axios from 'axios'
import youtubedl from 'youtube-dl-exec'

const ITUNES_SEARCH = 'https://itunes.apple.com/search'
const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup'
const RSS_CHARTS = (country, limit) =>
  `https://rss.applemarketingtools.com/api/v2/${country}/music/most-played/${limit}/songs.json`
const JAMENDO_TRACKS = 'https://api.jamendo.com/v3.0/tracks/'

const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000
const FULL_TTL = 6 * 60 * 60 * 1000
const CACHE_MAX = 1000
const FULL_MAX = 500
const inFlight = new Map()

function pruneOldest(map, max) {
  if (map.size <= max) return
  let oldestKey = null
  let oldestTs = Infinity
  for (const [k, v] of map) {
    if (v.ts < oldestTs) {
      oldestTs = v.ts
      oldestKey = k
    }
  }
  if (oldestKey) map.delete(oldestKey)
}

function sweep(map, ttl) {
  const now = Date.now()
  for (const [k, v] of map) if (now - v.ts > ttl) map.delete(k)
}

setInterval(() => {
  sweep(cache, CACHE_TTL)
  sweep(fullCache, FULL_TTL)
  pruneOldest(cache, CACHE_MAX)
  pruneOldest(fullCache, FULL_MAX)
}, 10 * 60 * 1000)
setInterval(() => {
  pruneOldest(cache, CACHE_MAX)
  pruneOldest(fullCache, FULL_MAX)
}, 60 * 1000)

function cached(key, fn) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data)
  if (inFlight.has(key)) return inFlight.get(key)
  const p = Promise.resolve()
    .then(fn)
    .then((data) => {
      const isEmpty = Array.isArray(data) && data.length === 0
      if (!isEmpty && !(data && typeof data === 'object' && data.error)) {
        cache.set(key, { data, ts: Date.now() })
        pruneOldest(cache, CACHE_MAX)
      }
      return data
    })
    .finally(() => inFlight.delete(key))
  inFlight.set(key, p)
  return p
}

function normalizeTrack(t) {
  return {
    id: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName,
    artwork: (t.artworkUrl100 || '').replace('100x100bb', '300x300bb'),
    previewUrl: t.previewUrl || null,
    duration: t.trackTimeMillis || 0,
    genre: t.primaryGenreName || null,
    collectionId: String(t.collectionId || ''),
    artistId: String(t.artistId || ''),
    releaseDate: t.releaseDate || null,
  }
}

export async function searchMusic(q, country = 'IN', limit = 25) {
  const key = `search:${country}:${q}:${limit}`
  return cached(key, async () => {
    const { data } = await axios.get(ITUNES_SEARCH, {
      params: { term: q, entity: 'song', country, limit, media: 'music' },
    })
    return (data.results || []).filter((t) => t.previewUrl).map(normalizeTrack)
  })
}

export async function getAlbum(collectionId) {
  const key = `album:${collectionId}`
  return cached(key, async () => {
    const { data } = await axios.get(ITUNES_LOOKUP, {
      params: { id: collectionId, entity: 'song' },
    })
    const rows = data.results || []
    const albumInfo = rows.find((r) => r.wrapperType === 'collection')
    const tracks = rows
      .filter((r) => r.wrapperType === 'track' && r.previewUrl)
      .map(normalizeTrack)
    return {
      collectionId: String(collectionId),
      name: albumInfo?.collectionName || tracks[0]?.album || 'Album',
      artist: albumInfo?.artistName || tracks[0]?.artist || '',
      artwork: (albumInfo?.artworkUrl100 || tracks[0]?.artwork || '').replace(
        '100x100bb',
        '600x600bb'
      ),
      genre: albumInfo?.primaryGenreName || tracks[0]?.genre || '',
      releaseDate: albumInfo?.releaseDate || null,
      trackCount: tracks.length,
      tracks,
    }
  })
}

const CHART_FALLBACK_QUERIES = {
  IN: ['arijit singh', 'bollywood hits', 'punjabi'],
  US: ['pop hits', 'top 50', 'rock'],
  JP: ['j-pop', 'anime songs', 'japanese pop'],
}

async function buildChartsFromSearch(country, limit) {
  const queries = CHART_FALLBACK_QUERIES[country] || ['top hits', 'best songs']
  const all = []
  for (const q of queries) {
    try {
      all.push(...(await searchMusic(q, country, 25)))
    } catch {
      // skip failing query
    }
  }
  const seen = new Set()
  const deduped = all.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
  return deduped.slice(0, limit)
}

export async function getCharts(country = 'US', limit = 20) {
  const key = `charts:${country}:${limit}`
  return cached(key, async () => {
    let tracks
    try {
      const { data } = await axios.get(RSS_CHARTS(country, limit), { timeout: 5000 })
      tracks = (data.feed?.results || [])
        .filter((t) => t.kind === 'songs')
        .map((t) => ({
          id: String(t.id),
          title: t.name,
          artist: t.artistName,
          album: '',
          artwork: (t.artworkUrl100 || '').replace('100x100bb', '300x300bb'),
          previewUrl: null,
          duration: 0,
          genre: t.genres?.[0]?.name || '',
          collectionId: '',
          releaseDate: t.releaseDate || null,
        }))
      if (!tracks.length) tracks = await buildChartsFromSearch(country, limit)
    } catch {
      tracks = await buildChartsFromSearch(country, limit)
    }
    return tracks
  })
}

export async function resolveChartTrack(track) {
  if (!track.previewUrl) {
    const { data } = await axios.get(ITUNES_SEARCH, {
      params: { term: `${track.title} ${track.artist}`, entity: 'song', country: 'US', limit: 1 },
    })
    const found = data.results?.[0]
    if (found) {
      return {
        ...track,
        album: found.collectionName,
        previewUrl: found.previewUrl || null,
        duration: found.trackTimeMillis || 0,
        collectionId: String(found.collectionId || ''),
      }
    }
  }
  return track
}

const fullCache = new Map()
const fullUrlCache = new Map()

const pipedInstances = [
  'https://api.piped.private.coffee',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.reallyaweso.me',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.pipedeployadmin.com',
  'https://pipedapi.birdsoft.eu.org',
  'https://api.piped.yt',
  'https://pipedapi.replicate.foundation',
  'https://pipedapi.ducks.party',
  'https://pipedapi.leptons.xyz',
]

const invidiousInstances = [
  'https://invidious.materialio.us',
  'https://yewtu.be',
  'https://invidious.f5.si',
  'https://invidious.nerdvpn.de',
  'https://inv.nadeko.net',
]

const instanceHealth = new Map()

function isDown(api) {
  const h = instanceHealth.get(api)
  return !!h && h.downUntil > Date.now()
}

function markDown(api) {
  instanceHealth.set(api, { downUntil: Date.now() + 5 * 60 * 1000 })
}

function healthyInstances() {
  return pipedInstances.filter((api) => !isDown(api))
}

function getPipedInstances() {
  return healthyInstances()
}

async function resolveViaPiped(query, maxInstances = 4) {
  const instances = getPipedInstances()
  for (const api of instances.slice(0, maxInstances)) {
    try {
      const { data } = await axios.get(`${api}/search`, {
        params: { q: query, filter: 'music_songs' },
        timeout: 15000,
      })
      const item = (data.items || []).find((i) => i.url?.includes('watch?v='))
      if (!item) continue
      const videoId = String(item.url).split('v=')[1]
      const { data: s } = await axios.get(`${api}/streams/${videoId}`, { timeout: 15000 })
      const audios = (s.audioStreams || [])
        .filter(
          (a) =>
            (a.mimeType || '').includes('audio') &&
            !String(a.url).includes('.m3u8') &&
            String(a.url).startsWith('http')
        )
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
      if (audios.length) return { url: audios[0].url }
    } catch {
      markDown(api)
    }
  }
  return null
}

async function getPipedStreamUrl(videoId) {
  const instances = getPipedInstances()
  for (const api of instances.slice(0, 4)) {
    try {
      const { data: s } = await axios.get(`${api}/streams/${videoId}`, { timeout: 8000 })
      const audios = (s.audioStreams || [])
        .filter(
          (a) =>
            (a.mimeType || '').includes('audio') &&
            !String(a.url).includes('.m3u8') &&
            String(a.url).startsWith('http')
        )
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
      if (audios.length) return audios[0].url
      const vids = (s.videoStreams || []).filter(
        (v) =>
          (v.mimeType || '').includes('audio') &&
          !String(v.url).includes('.m3u8') &&
          String(v.url).startsWith('http')
      )
      if (vids.length) return vids[0].url
    } catch {
      markDown(api)
    }
  }
  return null
}

function firstUrl(...promises) {
  return new Promise((resolve) => {
    let pending = promises.length
    if (!pending) return resolve(null)
    for (const p of promises) {
      Promise.resolve(p).then((u) => {
        const v = typeof u === 'string' ? u : u?.url || null
        if (v) resolve(v)
        else if (--pending === 0) resolve(null)
      })
    }
  })
}

async function raceIds(tasks) {
  return new Promise((resolve) => {
    let pending = tasks.length
    if (!pending) return resolve(null)
    for (const p of tasks) {
      Promise.resolve(p).then((id) => {
        if (id) resolve(id)
        else if (--pending === 0) resolve(null)
      })
    }
  })
}

async function getYoutubeId(query) {
  const piped = pipedInstances.filter((api) => !isDown(api)).slice(0, 4)
  const tasks = piped.map((api) =>
    axios
      .get(`${api}/search`, { params: { q: query, filter: 'music_songs' }, timeout: 7000 })
      .then(({ data }) => {
        const item = (data.items || []).find((i) => i.url?.includes('watch?v='))
        return item ? String(item.url).split('v=')[1] : null
      })
      .catch(() => {
        markDown(api)
        return null
      })
  )
  const id = await raceIds(tasks)
  if (id) return id
  for (const api of invidiousInstances) {
    const r = await axios
      .get(`${api}/api/v1/search`, { params: { q: query, type: 'video' }, timeout: 7000 })
      .then(({ data }) => {
        const item = (Array.isArray(data) ? data : []).find((i) => i.videoId)
        return item ? String(item.videoId) : null
      })
      .catch(() => null)
    if (r) return r
  }
  return null
}

const PLAYER_CLIENTS = [
  'android',
  'android_vr',
  'android_tv',
  'tv',
  'web_embedded',
  'web_music',
  'ios',
  'mweb',
  null,
]

async function resolveViaYtDlp(title, artist) {
  const query = `ytsearch1:${artist} ${title} official audio`.trim()
  let lastError = ''
  for (const client of PLAYER_CLIENTS) {
    try {
      const opts = {
        format: 'bestaudio[ext=m4a]/bestaudio/best',
        getUrl: true,
        noWarnings: true,
      }
      if (client) opts.extractorArgs = `youtube:player_client=${client}`
      const url = await youtubedl(query, opts)
      const str = String(url).trim()
      if (str.startsWith('http')) return { url: str }
      lastError = `No URL for client ${client || 'default'}`
    } catch (err) {
      lastError = `client ${client || 'default'}: ${String(err.message || err).slice(0, 200)}`
    }
  }
  console.warn('[YTDLP] failed:', lastError)
  return { error: lastError }
}

export async function searchJamendo(q, limit = 24) {
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!clientId) return { enabled: false, tracks: [] }
  const key = `jamendo:${q}:${limit}`
  return cached(key, async () => {
    const { data } = await axios.get(JAMENDO_TRACKS, {
      params: {
        client_id: clientId,
        format: 'json',
        limit,
        search: q,
        include: 'musicinfo',
        audioformat: 'mp32',
      },
    })
    const tracks = (data.results || []).map((t) => ({
      id: `jmd_${t.id}`,
      title: t.name,
      artist: t.artist_name,
      album: t.album_name || '',
      artwork: (t.image || t.album_image || '').replace('500x500', '300x300'),
      previewUrl: t.audio || t.audiodownload || null,
      duration: (t.duration || 0) * 1000,
      genre: t.musicinfo?.tags?.genres?.join(', ') || '',
      collectionId: `jmd_${t.album_id || t.id}`,
      releaseDate: t.releasedate || null,
      full: true,
    }))
    return { enabled: true, tracks: tracks.filter((t) => t.previewUrl) }
  })
}

const withTimeout = (p, ms) =>
  Promise.race([
    p,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ])

export async function resolveFullTrack(title, artist = '', opts = {}) {
  const key = `${artist} - ${title}`
  const cache = opts.withUrl ? fullUrlCache : fullCache
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < FULL_TTL) return hit.data
  const inflightKey = opts.withUrl ? `u:${key}` : `i:${key}`
  if (inFlight.has(inflightKey)) return inFlight.get(inflightKey)
  const run = async () => {
    if (opts.withUrl) {
      const url = await firstUrl(
        opts.videoId ? getPipedStreamUrl(opts.videoId) : Promise.resolve(null),
        withTimeout(resolveViaYtDlp(title, artist), process.env.RENDER ? 25000 : 15000)
      )
      if (url) return { url }
      const piped = await resolveViaPiped(`${artist} ${title} official audio`).catch(() => null)
      if (piped?.url) return { url: piped.url }
      return { error: 'No url source available (Piped, yt-dlp failed)' }
    }

    const jamendo = await searchJamendo(`${artist} ${title}`, 5).catch(() => ({ enabled: false, tracks: [] }))
    if (jamendo.enabled && jamendo.tracks.length) {
      return { url: jamendo.tracks[0].previewUrl }
    }

    if (!process.env.RENDER) {
      const yt = await resolveViaYtDlp(title, artist).catch(() => ({}))
      if (yt.url) return { url: yt.url }
    }

    const youtubeId = await getYoutubeId(`${artist} ${title} official audio`).catch(() => null)
    if (youtubeId) return { youtubeId }

    const piped = await resolveViaPiped(`${artist} ${title} official audio`).catch(() => null)
    if (piped?.url) return { url: piped.url }

    return { error: 'No source available (Jamendo, YouTube, Piped all failed)' }
  }
  const p = run().then((data) => {
    if (!data?.error) {
      cache.set(key, { data, ts: Date.now() })
      pruneOldest(cache, FULL_MAX)
      if (!opts.withUrl && data.youtubeId && process.env.RENDER) {
        resolveFullTrack(title, artist, { withUrl: true }).catch(() => {})
      }
    }
    return data
  })
  inFlight.set(inflightKey, p)
  return p
}

export async function getRecent(limit = 20) {
  const key = `recent:${limit}`
  return cached(key, async () => {
    const queries = ['new song', 'latest song', 'new album 2026', 'trending songs', 'fresh music']
    const all = []
    for (const q of queries) {
      try {
        all.push(...(await searchMusic(q, 'US', 25)))
      } catch {
        // skip failing query
      }
    }
    const seen = new Set()
    const deduped = all.filter((t) => {
      if (seen.has(t.id)) return false
      seen.add(t.id)
      return true
    })
    deduped.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0))
    return deduped.slice(0, limit)
  })
}

async function runPool(items, size, fn) {
  const results = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
    }
  })
  await Promise.all(workers)
  return results
}

export async function getArtistSongs(q, cap = 400) {
  const key = `artist:${q}`
  return cached(key, async () => {
    const map = new Map()

    const songs = await searchMusic(q, 'US', 200)
    songs.forEach((t) => map.set(t.id, t))

    const { data } = await axios.get(ITUNES_SEARCH, {
      params: { term: q, entity: 'album', country: 'US', limit: 200 },
    })
    const albums = (data.results || [])
      .filter((a) => a.wrapperType === 'collection')
      .slice(0, 30)

    const qLower = q.toLowerCase()
    await runPool(albums, 6, async (album) => {
      try {
        const { data: d } = await axios.get(ITUNES_LOOKUP, {
          params: { id: album.collectionId, entity: 'song' },
        })
        ;(d.results || []).forEach((r) => {
          if (r.wrapperType !== 'track' || !r.previewUrl) return
          if (!String(r.artistName).toLowerCase().includes(qLower)) return
          const t = normalizeTrack(r)
          if (!map.has(t.id)) map.set(t.id, t)
        })
      } catch {
        // skip album
      }
    })

    return [...map.values()]
      .sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0))
      .slice(0, cap)
  })
}

const LRCLIB_GET = 'https://lrclib.net/api/get'
const LRCLIB_SEARCH = 'https://lrclib.net/api/search'

export async function getLyrics(title, artist = '') {
  const key = `lyrics:${artist}|${title}`
  return cached(key, async () => {
    try {
      const { data } = await axios.get(LRCLIB_GET, {
        params: { track_name: title, artist_name: artist },
        timeout: 10000,
      })
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        return {
          synced: data.syncedLyrics || null,
          plain: data.plainLyrics || null,
          title: data.trackName || title,
          artist: data.artistName || artist,
        }
      }
    } catch {
      // fall through to search
    }
    try {
      const { data: list } = await axios.get(LRCLIB_SEARCH, {
        params: { q: `${artist} ${title}`.trim() },
        timeout: 10000,
      })
      const hit = (list || []).find((d) => d.syncedLyrics || d.plainLyrics)
      if (hit) {
        return {
          synced: hit.syncedLyrics || null,
          plain: hit.plainLyrics || null,
          title: hit.trackName || title,
          artist: hit.artistName || artist,
        }
      }
    } catch {
      // nothing found
    }
    return null
  })
}

export async function getArtist(artistId) {
  const key = `artistPage:${artistId}`
  return cached(key, async () => {
    const [songsRes, albumsRes] = await Promise.all([
      axios.get(ITUNES_LOOKUP, {
        params: { id: artistId, entity: 'song', limit: 200 },
        timeout: 12000,
      }),
      axios.get(ITUNES_LOOKUP, {
        params: { id: artistId, entity: 'album', limit: 50 },
        timeout: 12000,
      }),
    ])
    const songRows = songsRes.data.results || []
    const albumRows = (albumsRes.data.results || []).filter((r) => r.wrapperType === 'collection')
    const artistRow = songRows.find((r) => r.wrapperType === 'artist')
    const tracks = songRows
      .filter((r) => r.wrapperType === 'track' && r.previewUrl)
      .map(normalizeTrack)
    const albums = albumRows.map((a) => ({
      collectionId: String(a.collectionId),
      name: a.collectionName,
      artist: a.artistName || '',
      artwork: (a.artworkUrl100 || '').replace('100x100bb', '300x300bb'),
      releaseDate: a.releaseDate || null,
      trackCount: a.trackCount || 0,
    }))
    return {
      id: String(artistId),
      name: artistRow?.artistName || tracks[0]?.artist || albums[0]?.artist || 'Artist',
      artwork: (artistRow?.artworkUrl100 || albums[0]?.artwork || tracks[0]?.artwork || '').replace(
        '100x100bb',
        '300x300bb'
      ),
      genre: artistRow?.primaryGenreName || tracks[0]?.genre || '',
      topTracks: tracks.slice(0, 50),
      albums,
    }
  })
}

export async function getSimilar(title, artist = '') {
  const key = `similar:${artist}|${title}`
  return cached(key, async () => {
    const map = new Map()
    const results = await Promise.allSettled([
      artist ? searchMusic(artist, 'US', 50) : Promise.resolve([]),
      searchMusic(`${artist} ${title}`.trim(), 'IN', 25),
    ])
    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      for (const t of r.value) {
        if (String(t.title).toLowerCase() === String(title).toLowerCase()) continue
        if (!map.has(t.id)) map.set(t.id, t)
      }
    }
    return [...map.values()].slice(0, 30)
  })
}

export async function getTrack(trackId) {
  const key = `track:${trackId}`
  return cached(key, async () => {
    const { data } = await axios.get(ITUNES_LOOKUP, {
      params: { id: trackId, entity: 'song', limit: 1 },
      timeout: 12000,
    })
    const row = (data.results || []).find(
      (r) => r.wrapperType === 'track' && r.previewUrl
    )
    if (!row) return null
    return normalizeTrack(row)
  })
}

function seededShuffle(arr, seedStr) {
  let seed = 0
  for (const ch of seedStr) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function getDailyPool() {
  const dayKey = new Date().toISOString().slice(0, 10)
  const key = `daily:${dayKey}`
  return cached(key, async () => {
    const pools = await Promise.allSettled([
      searchMusic('top hits', 'IN', 50),
      searchMusic('best of 2026', 'US', 30),
      getCharts('IN', 50),
      getCharts('US', 50),
      getRecent(30),
    ])
    const seen = new Map()
    for (const r of pools) {
      if (r.status !== 'fulfilled') continue
      for (const t of r.value) {
        if (t.previewUrl && !seen.has(t.id)) seen.set(t.id, t)
      }
    }
    return [...seen.values()]
  })
}

export async function getUserTopArtists(userId) {
  try {
    const { default: User } = await import('../models/User.js')
    const user = await User.findById(userId).select('favorites history')
    const counts = {}
    const bump = (name) => {
      if (!name) return
      counts[name] = (counts[name] || 0) + 1
    }
    for (const t of user?.favorites || []) bump(t.artist)
    for (const t of user?.history || []) bump(t.artist)
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)
  } catch {
    return []
  }
}

export async function getArtistDailyTracks(artist) {
  const dayKey = new Date().toISOString().slice(0, 10)
  const key = `dailyArtist:${dayKey}:${artist}`
  return cached(key, async () => {
    try {
      return await searchMusic(artist, 'IN', 25)
    } catch {
      return []
    }
  })
}

export async function getDaily(userId) {
  const dayKey = new Date().toISOString().slice(0, 10)
  const pool = await getDailyPool()
  if (!pool.length) return []

  const artists = userId ? await getUserTopArtists(userId) : []
  const extra = []
  if (artists.length) {
    const settled = await Promise.allSettled(artists.map((a) => getArtistDailyTracks(a)))
    for (const r of settled) if (r.status === 'fulfilled') extra.push(...r.value)
  }

  const seen = new Map(pool.map((t) => [t.id, t]))
  for (const t of extra) if (t.previewUrl && !seen.has(t.id)) seen.set(t.id, t)
  const all = [...seen.values()]

  if (artists.length && extra.length) {
    const guaranteed = seededShuffle(extra, `${dayKey}:${userId}:art`).slice(0, 5)
    const rest = all.filter((t) => !guaranteed.some((g) => g.id === t.id))
    const fill = seededShuffle(rest, `${dayKey}:${userId}`).slice(0, 10 - guaranteed.length)
    return seededShuffle([...guaranteed, ...fill], `${dayKey}:${userId}:mix`).slice(0, 10)
  }

  return seededShuffle(all, `${dayKey}:${userId}`).slice(0, 10)
}

const MOODS = [
  { name: 'Sad', query: 'sad songs', color: 'from-blue-600 to-indigo-900' },
  { name: 'Romantic', query: 'romantic songs', color: 'from-pink-600 to-rose-900' },
  { name: 'Party', query: 'party songs', color: 'from-orange-500 to-red-800' },
  { name: 'Workout', query: 'workout music', color: 'from-lime-500 to-green-800' },
  { name: 'Focus', query: 'focus music', color: 'from-teal-500 to-cyan-900' },
  { name: 'Sleep', query: 'sleep music', color: 'from-slate-500 to-slate-900' },
  { name: 'Feel Good', query: 'feel good songs', color: 'from-yellow-400 to-amber-800' },
  { name: 'Chill', query: 'chill songs', color: 'from-cyan-500 to-blue-900' },
  { name: 'Road Trip', query: 'road trip songs', color: 'from-red-500 to-orange-900' },
  { name: 'Retro', query: 'retro hits', color: 'from-purple-600 to-fuchsia-900' },
]

export async function getMoods() {
  const key = 'moods'
  return cached(key, async () => {
    const results = await runPool(MOODS, 3, async (mood) => {
      try {
        const tracks = await searchMusic(mood.query, 'US', 6)
        return { name: mood.name, query: mood.query, color: mood.color, tracks }
      } catch {
        return { name: mood.name, query: mood.query, color: mood.color, tracks: [] }
      }
    })
    return results
  })
}
