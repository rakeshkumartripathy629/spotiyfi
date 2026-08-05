import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X, Loader2 } from 'lucide-react'
import { music } from '../api/client'
import TrackRow from '../components/TrackRow'
import Spinner from '../components/Spinner'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [input, setInput] = useState(q)
  const [country, setCountry] = useState('IN')
  const [countries, setCountries] = useState({})
  const [tracks, setTracks] = useState([])
  const [jamendo, setJamendo] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    setInput(q)
  }, [q])

  useEffect(() => {
    const v = input.trim()
    if (v === q) return
    const t = setTimeout(() => {
      if (v) setParams({ q: v })
      else setParams({})
    }, 500)
    return () => clearTimeout(t)
  }, [input])

  useEffect(() => {
    music.countries().then((c) => setCountries(c)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!q) return
    let alive = true
    setLoading(true)
    setSearched(true)
    setExpanded(false)
    setExpanding(false)
    setJamendo([])
    music
      .search(q, country, 50)
      .then((res) => {
        if (alive) setTracks(res.tracks)
      })
      .catch(() => alive && setTracks([]))
      .finally(() => alive && setLoading(false))
    music
      .jamendo(q, 24)
      .then((res) => {
        if (alive && res.enabled) setJamendo(res.tracks)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [q, country])

  const loadAll = () => {
    setExpanding(true)
    music
      .artistSongs(q)
      .then((res) => {
        setTracks((prev) => {
          const map = new Map()
          prev.forEach((t) => map.set(t.id, t))
          res.tracks.forEach((t) => {
            if (!map.has(t.id)) map.set(t.id, t)
          })
          return [...map.values()].sort(
            (a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0)
          )
        })
        setExpanded(true)
      })
      .catch(() => {})
      .finally(() => setExpanding(false))
  }

  const submit = (e) => {
    e.preventDefault()
    if (input.trim()) setParams({ q: input.trim() })
  }

  return (
    <div className="p-6">
      <form onSubmit={submit} className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-3 rounded-full bg-spotify-hover px-4 py-2">
          <SearchIcon className="h-5 w-5 text-spotify-text" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Singer name or song — any language..."
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full bg-transparent text-white outline-none placeholder:text-spotify-text"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('')
                setParams({})
              }}
              className="text-spotify-text hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-full bg-spotify-hover px-4 py-2.5 text-sm font-semibold text-white outline-none"
        >
          {Object.entries(countries).map(([code, name]) => (
            <option key={code} value={code} className="bg-spotify-card">
              {name} ({code})
            </option>
          ))}
        </select>
      </form>

      {!searched && (
        <p className="mt-16 text-center text-spotify-text">
          Search karo kisi bhi singer ya song ka naam — saare songs dikhenge. Hindi, English,
          Korean, Japanese sab.
        </p>
      )}

      {loading && <Spinner />}

      {searched && !loading && tracks.length === 0 && (
        <p className="mt-16 text-center text-spotify-text">No results for "{q}".</p>
      )}

      {searched && !loading && tracks.length > 0 && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold">
              {expanded ? `All songs — "${q}"` : `Results for "${q}"`}
              <span className="text-sm font-normal text-spotify-text"> ({tracks.length})</span>
            </h2>
            {expanding && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading all songs...
              </span>
            )}
            {!expanded && !expanding && (
              <button
                onClick={loadAll}
                className="rounded-full bg-spotify-green px-3 py-1 text-xs font-bold text-black hover:scale-105"
              >
                Load all songs
              </button>
            )}
          </div>
          <div className="overflow-hidden rounded-md bg-spotify-card/50">
            {tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} list={tracks} showAlbum />
            ))}
          </div>

          {jamendo.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">
                  Full songs — Jamendo
                  <span className="text-sm font-normal text-spotify-text"> ({jamendo.length})</span>
                </h2>
                <span className="rounded-full bg-spotify-green/20 px-2 py-0.5 text-[10px] font-bold text-spotify-green">
                  FULL
                </span>
              </div>
              <div className="overflow-hidden rounded-md bg-spotify-card/50">
                {jamendo.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i} list={jamendo} showAlbum />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
