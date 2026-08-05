import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import { music } from '../api/client'
import TrackRow from '../components/TrackRow'
import Spinner from '../components/Spinner'
import { usePlayer } from '../context/PlayerContext'
import { fallbackArtwork } from '../utils/format'

export default function Album() {
  const { id } = useParams()
  const { playTracks } = usePlayer()
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    music
      .album(id)
      .then(setAlbum)
      .catch(() => setAlbum(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />
  if (!album) return <p className="p-6 text-spotify-text">Album not found.</p>

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <img
          src={album.artwork || fallbackArtwork(album.name)}
          alt={album.name}
          className="h-44 w-44 shrink-0 rounded-lg object-cover shadow-xl"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-spotify-text">Album</p>
          <h1 className="truncate text-4xl font-bold">{album.name}</h1>
          <p className="mt-1 text-sm text-spotify-text">
            {album.artist} • {album.trackCount} songs
          </p>
          <button
            onClick={() => playTracks(album.tracks, 0)}
            disabled={!album.tracks.length}
            className="mt-4 flex items-center gap-2 rounded-full bg-spotify-green px-6 py-2.5 font-bold text-black transition hover:scale-105 disabled:opacity-40"
          >
            <Play className="h-5 w-5 fill-current" /> Play
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md bg-spotify-card/50">
        {album.tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} list={album.tracks} />
        ))}
      </div>
    </div>
  )
}
