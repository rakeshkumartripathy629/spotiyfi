import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Trash2 } from 'lucide-react'
import { libraryApi } from '../api/client'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import TrackRow from '../components/TrackRow'
import Spinner from '../components/Spinner'
import { fallbackArtwork } from '../utils/format'

export default function Playlist() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { playTracks } = usePlayer()
  const { deletePlaylist, removeFromPlaylist } = useLibrary()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    libraryApi
      .playlist(id)
      .then(({ playlist }) => setPlaylist(playlist))
      .catch(() => setPlaylist(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />
  if (!playlist) return <p className="p-6 text-spotify-text">Playlist not found.</p>

  const remove = async (track) => {
    const res = await removeFromPlaylist(playlist._id, track.id)
    setPlaylist(res)
  }

  const del = async () => {
    await deletePlaylist(playlist._id)
    navigate('/')
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-spotify-green to-emerald-900 text-6xl font-bold shadow-xl">
          {playlist.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-spotify-text">Playlist</p>
          <h1 className="truncate text-4xl font-bold">{playlist.name}</h1>
          <p className="mt-1 text-sm text-spotify-text">
            {playlist.tracks.length} songs
            {playlist.description && ` • ${playlist.description}`}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => playTracks(playlist.tracks, 0)}
              disabled={!playlist.tracks.length}
              className="flex items-center gap-2 rounded-full bg-spotify-green px-6 py-2.5 font-bold text-black transition hover:scale-105 disabled:opacity-40"
            >
              <Play className="h-5 w-5 fill-current" /> Play
            </button>
            <button
              onClick={del}
              className="rounded-full p-2.5 text-spotify-text hover:text-red-500"
              title="Delete playlist"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {playlist.tracks.length === 0 ? (
        <p className="mt-10 text-center text-spotify-text">
          This playlist is empty. Add songs with the + button next to any track.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md bg-spotify-card/50">
          {playlist.tracks.map((t, i) => (
            <TrackRow
              key={`${t.id}-${i}`}
              track={t}
              index={i}
              list={playlist.tracks}
              showAlbum
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
