import { useEffect, useState } from 'react'
import { Compass } from 'lucide-react'
import { music } from '../api/client'
import TrackRow from '../components/TrackRow'
import Spinner from '../components/Spinner'

export default function Charts() {
  const [countries, setCountries] = useState({})
  const [country, setCountry] = useState('IN')
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  useEffect(() => {
    music.countries().then((c) => setCountries(c)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    music
      .charts(country, 25)
      .then((res) => {
        setTracks(res.tracks)
        setName(res.name)
      })
      .catch(() => setTracks([]))
      .finally(() => setLoading(false))
  }, [country])

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Compass className="h-8 w-8 text-spotify-green" /> Explore
        </h1>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-full bg-spotify-hover px-4 py-2 text-sm font-semibold text-white outline-none"
        >
          {Object.entries(countries).map(([code, n]) => (
            <option key={code} value={code} className="bg-spotify-card">
              {n} ({code})
            </option>
          ))}
        </select>
      </div>

      <h2 className="mb-3 text-xl font-bold">
        Top 25 — {name || country}
      </h2>

      {loading ? (
        <Spinner />
      ) : tracks.length === 0 ? (
        <p className="text-spotify-text">No previews available for this country.</p>
      ) : (
        <div className="overflow-hidden rounded-md bg-spotify-card/50">
          {tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} list={tracks} showAlbum />
          ))}
        </div>
      )}
    </div>
  )
}
