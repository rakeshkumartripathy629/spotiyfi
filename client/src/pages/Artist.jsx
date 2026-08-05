import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import { music } from '../api/client'
import TrackRow from '../components/TrackRow'
import PlaylistCard from '../components/PlaylistCard'
import Spinner from '../components/Spinner'
import { usePlayer } from '../context/PlayerContext'
import { fallbackArtwork } from '../utils/format'

export default function Artist() {
  const { id } = useParams()
  const { playTracks } = usePlayer()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    music
      .artist(id)
      .then((a) => alive && setArtist(a))
      .catch(() => alive && setArtist(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  if (loading) return <Spinner />
  if (!artist) return <p className="p-6 text-spotify-text">Artist not found.</p>

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
        <img
          src={artist.artwork || fallbackArtwork(artist.name)}
          alt={artist.name}
          className="h-44 w-44 shrink-0 rounded-full object-cover shadow-xl"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-spotify-text">Artist</p>
          <h1 className="mt-1 truncate text-4xl font-bold text-white">{artist.name}</h1>
          <p className="mt-2 text-sm text-spotify-text">
            {artist.topTracks.length} songs
            {artist.albums.length ? ` • ${artist.albums.length} albums` : ''}
          </p>
          <button
            onClick={() => playTracks(artist.topTracks, 0)}
            disabled={!artist.topTracks.length}
            className="mt-4 flex items-center gap-2 rounded-full bg-spotify-green px-6 py-2.5 font-bold text-black transition hover:scale-105 disabled:opacity-40"
          >
            <Play className="h-5 w-5 fill-current" /> Play
          </button>
        </div>
      </div>

      {artist.topTracks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold text-white">Top songs</h2>
          <div className="overflow-hidden rounded-md bg-spotify-card/50">
            {artist.topTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} list={artist.topTracks} showAlbum />
            ))}
          </div>
        </section>
      )}

      {artist.albums.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold text-white">Albums</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {artist.albums.map((a) => (
              <PlaylistCard
                key={a.collectionId}
                title={a.name}
                subtitle={a.releaseDate ? new Date(a.releaseDate).getFullYear() : 'Album'}
                artwork={a.artwork}
                to={`/album/${a.collectionId}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
