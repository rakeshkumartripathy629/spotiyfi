import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { fallbackArtwork } from '../utils/format'

export default function Recent() {
  const { recent, playTracks } = usePlayer()

  if (!recent.length)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-spotify-text">Abhi koi gaana nahi chala.</p>
        <Link to="/" className="rounded-full bg-spotify-green px-5 py-2 font-bold text-black">
          Home par jao
        </Link>
      </div>
    )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recently played</h1>
          <p className="mt-1 text-sm text-spotify-text">{recent.length} songs</p>
        </div>
        <button
          onClick={() => playTracks(recent, 0)}
          className="flex items-center gap-1.5 rounded-full bg-spotify-green px-4 py-1.5 text-sm font-bold text-black transition hover:scale-105"
        >
          <Play className="h-4 w-4 fill-current" /> Play all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {recent.map((t, i) => (
          <button
            key={`${t.id}-${i}`}
            onClick={() => playTracks(recent, i)}
            className="group text-left"
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
      </div>
    </div>
  )
}
