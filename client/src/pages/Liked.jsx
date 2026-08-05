import { Play } from 'lucide-react'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import TrackRow from '../components/TrackRow'
import { Heart } from 'lucide-react'

export default function Liked() {
  const { favorites } = useLibrary()
  const { playTracks } = usePlayer()

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-700 to-pink-600 shadow-xl">
          <Heart className="h-20 w-20 fill-white text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-spotify-text">Playlist</p>
          <h1 className="text-4xl font-bold">Liked Songs</h1>
          <p className="mt-1 text-sm text-spotify-text">{favorites.length} songs</p>
          <button
            onClick={() => playTracks(favorites, 0)}
            disabled={!favorites.length}
            className="mt-4 flex items-center gap-2 rounded-full bg-spotify-green px-6 py-2.5 font-bold text-black transition hover:scale-105 disabled:opacity-40"
          >
            <Play className="h-5 w-5 fill-current" /> Play
          </button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <p className="mt-10 text-center text-spotify-text">
          No liked songs yet. Tap the heart on any track to save it here.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md bg-spotify-card/50">
          {favorites.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} list={favorites} showAlbum />
          ))}
        </div>
      )}
    </div>
  )
}
