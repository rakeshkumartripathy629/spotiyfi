import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { music } from '../api/client'
import TrackRow from '../components/TrackRow'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'

const TRENDING = [
  { title: 'Trending in India', country: 'IN' },
  { title: 'Trending Worldwide', country: 'US' },
  { title: 'Trending in Japan', country: 'JP' },
]

export default function Home() {
  const { user } = useAuth()
  const { recent } = usePlayer()
  const [sections, setSections] = useState([])
  const [fresh, setFresh] = useState([])
  const [moods, setMoods] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      Promise.all(
        TRENDING.map((s) => music.charts(s.country, 10).then((res) => ({ ...s, tracks: res.tracks })))
      ),
      music.recent(20),
      music.moods(),
    ])
      .then(([trending, recentRes, moodRes]) => {
        if (!alive) return
        setSections(trending)
        setFresh(recentRes.tracks)
        setMoods(moodRes.moods || [])
      })
      .catch(() => alive && setSections([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">
        {user ? `${greeting}, ${user.name.split(' ')[0]}` : greeting}
      </h1>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {recent.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-bold">
                Recently played{' '}
                <span className="text-sm font-normal text-spotify-text">({recent.length} songs)</span>
              </h2>
              <div className="overflow-hidden rounded-md bg-spotify-card/50">
                {recent.slice(0, 10).map((t, i) => (
                  <TrackRow key={`r-${t.id}`} track={t} index={i} list={recent} />
                ))}
              </div>
            </section>
          )}

          {moods.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-bold">Moods & genres</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {moods.map((m) => (
                  <Link
                    key={m.name}
                    to={`/search?q=${encodeURIComponent(m.query)}`}
                    className={`relative flex h-28 items-end rounded-lg bg-gradient-to-br ${m.color} p-3 transition hover:scale-[1.03]`}
                  >
                    <div>
                      <p className="text-lg font-bold">{m.name}</p>
                      <p className="text-xs text-white/70">{m.tracks.length} songs</p>
                    </div>
                  </Link>
                ))}
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
        </>
      )}
    </div>
  )
}
