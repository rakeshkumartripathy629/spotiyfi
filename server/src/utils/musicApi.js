import axios from 'axios'
import youtubedl from 'youtube-dl-exec'

const ITUNES_SEARCH = 'https://itunes.apple.com/search'
const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup'
const RSS_CHARTS = (country, limit) =>
  `https://rss.applemarketingtools.com/api/v2/${country}/music/most-played/${limit}/songs.json`

const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000

function cached(key, fn) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data)
  return fn().then((data) => {
    cache.set(key, { data, ts: Date.now() })
    return data
  })
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

export async function getCharts(country = 'US', limit = 20) {
  const key = `charts:${country}:${limit}`
  return cached(key, async () => {
    const { data } = await axios.get(RSS_CHARTS(country, limit))
    return (data.feed?.results || [])
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
const FULL_TTL = 6 * 60 * 60 * 1000

const PLAYER_CLIENTS = ['android', 'tv', 'web_embedded', null]

export async function resolveFullTrack(title, artist = '') {
  const key = `${artist} - ${title}`
  const hit = fullCache.get(key)
  if (hit && Date.now() - hit.ts < FULL_TTL) return hit.url

  const query = `ytsearch1:${artist} ${title} official audio`.trim()
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
      if (str.startsWith('http')) {
        fullCache.set(key, { url: str, ts: Date.now() })
        return str
      }
    } catch {
      // try next player client
    }
  }
  return null
}

export async function getRecent(limit = 20) {
  const key = `recent:${limit}`
  return cached(key, async () => {
    const queries = ['new song', 'latest song', 'new album 2026']
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
