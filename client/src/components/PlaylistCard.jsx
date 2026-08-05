import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { fallbackArtwork } from '../utils/format'

export default function PlaylistCard({ title, subtitle, artwork, to }) {
  return (
    <Link
      to={to}
      className="group rounded-md bg-spotify-card p-3 transition hover:bg-spotify-hover"
    >
      <div className="relative">
        <img
          src={artwork || fallbackArtwork(title)}
          alt={title}
          className="aspect-square w-full rounded-md object-cover"
        />
        <div className="absolute bottom-2 right-2 hidden h-10 w-10 items-center justify-center rounded-full bg-spotify-green text-black opacity-0 shadow-lg transition group-hover:flex group-hover:opacity-100">
          <Play className="h-5 w-5 fill-current pl-0.5" />
        </div>
      </div>
      <p className="mt-3 truncate text-sm font-bold text-white">{title}</p>
      <p className="truncate text-xs text-spotify-text">{subtitle}</p>
    </Link>
  )
}
