import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Play, CloudRain, Heart, PartyPopper, Dumbbell, Target, Moon, Smile, Leaf, Car, Radio } from 'lucide-react'
import { music, libraryApi } from '../api/client'
import TrackRow from '../components/TrackRow'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { fallbackArtwork } from '../utils/format'

const MOOD_ICONS = {
  Sad: CloudRain,
  Romantic: Heart,
  Party: PartyPopper,
  Workout: Dumbbell,
  Focus: Target,
  Sleep: Moon,
  'Feel Good': Smile,
  Chill: Leaf,
  'Road Trip': Car,
  Retro: Radio,
}

const TRENDING = [
  { title: 'Trending in India', country: 'IN' },
  { title: 'Trending Worldwide', country: 'US' },
  { title: 'Trending in Japan', country: 'JP' },
]

export default function Home() {
  const { user } = useAuth()
  const { recent, playTracks } = usePlayer()
  const [sections, setSections] = useState([])
  const [fresh, setFresh] = useState([])
  const [moods, setMoods] = useState([])
  const [daily, setDaily] = useState([])
  const [recap, setRecap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.allSettled([
      Promise.all(
        TRENDING.map((s) =>
          music.charts(s.country, 10).then((res) => ({ ...s, tracks: res.tracks }))
        )
      ),
      music.recent(20),
      music.moods(),
      music.daily(),
      libraryApi.recap(),
    ]).then(([trending, rec, mood, dailyRes, recapRes]) => {
      setSections(trending.status === 'fulfilled' ? trending.value : [])
      setFresh(rec.status === 'fulfilled' ? rec.value.tracks : [])
      setMoods(mood.status === 'fulfilled' ? mood.value.moods : [])
      setDaily(dailyRes.status === 'fulfilled' ? dailyRes.value.tracks : [])
      setRecap(recapRes.status === 'fulfilled' ? recapRes.value.week : null)
      setError(
        trending.status === 'rejected' && rec.status === 'rejected' && mood.status === 'rejected'
          ? 'Music load nahi ho paya. Server abhi jaga raha hoga — retry karo.'
          : ''
      )
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        {user?.name ? `${greeting}, ${user.name.split(' ')[0]}` : greeting}
      </h1>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-md bg-amber-500/15 px-4 py-3 text-sm text-amber-400">
              <span>{error}</span>
              <button
                onClick={load}
                className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 font-bold text-amber-400 hover:bg-amber-500/30"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {recap && recap.totalSongs > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <RecapCard label="Sune is hafte" value={String(recap.totalSongs)} />
              <RecapCard label="Minutes" value={String(recap.totalMinutes)} />
              <RecapCard label="Top artist" value={recap.topArtist || '—'} />
              <RecapCard label="Favourite gaana" value={recap.topTrack || '—'} />
            </div>
          )}

          {daily.length > 0 && (
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">Aaj ke 10 gaane</h2>
                <button
                  onClick={() => playTracks(daily, 0)}
                  className="flex items-center gap-1.5 rounded-full bg-spotify-green px-4 py-1.5 text-sm font-bold text-black transition hover:scale-105"
                >
                  <Play className="h-4 w-4 fill-current" /> Play all
                </button>
              </div>
              <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                {daily.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => playTracks(daily, i)}
                    className="group w-32 shrink-0 snap-start text-left"
                  >
                    <div className="relative">
                      <img
                        src={t.artwork || fallbackArtwork(t.title)}
                        alt={t.title}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 hidden h-9 w-9 items-center justify-center rounded-full bg-spotify-green text-black shadow-lg group-hover:flex">
                        <Play className="h-4 w-4 fill-current pl-0.5" />
                      </span>
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-white">{t.title}</p>
                    <p className="truncate text-xs text-spotify-text">{t.artist}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Recently played{' '}
                  <span className="text-sm font-normal text-spotify-text">
                    ({recent.length} songs)
                  </span>
                </h2>
                <button
                  onClick={() => playTracks(recent, 0)}
                  className="flex items-center gap-1.5 rounded-full bg-spotify-hover px-4 py-1.5 text-sm font-bold text-white transition hover:scale-105"
                >
                  <Play className="h-4 w-4 fill-current" /> Play all
                </button>
              </div>
              <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                {recent.slice(0, 10).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => playTracks(recent, recent.findIndex((r) => r.id === t.id))}
                    className="group w-32 shrink-0 snap-start text-left"
                  >
                    <div className="relative">
                      <img
                        src={t.artwork || fallbackArtwork(t.title)}
                        alt={t.title}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 hidden h-9 w-9 items-center justify-center rounded-full bg-spotify-green text-black shadow-lg group-hover:flex">
                        <Play className="h-4 w-4 fill-current pl-0.5" />
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-white">{t.title}</p>
                    <p className="truncate text-xs text-spotify-text">{t.artist}</p>
                  </button>
                ))}
                {recent.length > 10 && (
                  <Link
                    to="/recent"
                    className="flex w-32 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-lg border border-spotify-hover bg-spotify-card/50 text-center transition hover:border-spotify-green hover:text-spotify-green"
                  >
                    <span className="text-2xl font-bold">→</span>
                    <span className="text-sm font-semibold">See all</span>
                  </Link>
                )}
              </div>
            </section>
          )}

          {fresh.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-bold">Fresh & recent</h2>
              <div className="overflow-hidden rounded-md bg-spotify-card/50">
                {fresh.slice(0, 10).map((t, i) => (
                  <TrackRow key={`f-${t.id}`} track={t} index={i} list={fresh} showAlbum />
                ))}
              </div>
            </section>
          )}

          {moods.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-bold">Moods & genres</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {moods.map((m) => {
                  const MoodIcon = MOOD_ICONS[m.name]
                  return (
                    <Link
                      key={m.name}
                      to={`/search?q=${encodeURIComponent(m.query)}`}
                      className={`relative flex h-28 items-end rounded-lg bg-gradient-to-br ${m.color} p-3 transition hover:scale-[1.03]`}
                    >
                      {MoodIcon && (
                        <span className="absolute right-3 top-3 text-white/70">
                          <MoodIcon className="h-9 w-9" strokeWidth={1.5} />
                        </span>
                      )}
                      <div>
                        <p className="text-lg font-bold">{m.name}</p>
                        <p className="text-xs text-white/70">{m.tracks.length} songs</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {sections.map((sec) => (
            <section key={sec.country} className="mb-8">
              <h2 className="mb-3 text-xl font-bold">{sec.title}</h2>
              <div className="overflow-hidden rounded-md bg-spotify-card/50">
                {sec.tracks.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i} list={sec.tracks} />
                ))}
              </div>
            </section>
          ))}

          {!error && !sections.length && !fresh.length && !moods.length && recent.length === 0 && (
            <p className="text-center text-spotify-text">Koi songs nahi mila.</p>
          )}
        </>
      )}
    </div>
  )
}

function RecapCard({ label, value }) {
  return (
    <div className="rounded-lg bg-spotify-card/70 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-spotify-text">{label}</p>
      <p className="mt-1 truncate text-base font-bold text-white">{value}</p>
    </div>
  )
}
