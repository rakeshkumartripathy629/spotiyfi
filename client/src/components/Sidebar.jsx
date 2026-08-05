import { NavLink, useNavigate } from 'react-router-dom'
import {
  Music2,
  Home as HomeIcon,
  Search,
  Compass,
  Heart,
  Plus,
  LogOut,
  LogIn,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { playlists, createPlaylist } = useLibrary()
  const navigate = useNavigate()

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'text-white' : 'text-spotify-text hover:text-white'
    }`

  const handleNewPlaylist = async () => {
    const name = prompt('Playlist name?')
    if (!name?.trim()) return
    const pl = await createPlaylist(name.trim())
    navigate(`/playlist/${pl._id}`)
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-black p-3 md:flex">
      <div className="flex items-center gap-2 px-2 py-3 text-2xl font-bold text-white">
        <Music2 className="h-7 w-7 text-spotify-green" />
        <span>
          Sqo<span className="text-spotify-green">tify</span>
        </span>
      </div>

      <nav className="space-y-1">
        <NavLink to="/" className={navClass}>
          <HomeIcon className="h-5 w-5" /> Home
        </NavLink>
        <NavLink to="/search" className={navClass}>
          <Search className="h-5 w-5" /> Search
        </NavLink>
        <NavLink to="/charts" className={navClass}>
          <Compass className="h-5 w-5" /> Explore
        </NavLink>
      </nav>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto rounded-md bg-spotify-card p-3">
        <div className="flex items-center justify-between px-1 text-spotify-text">
          <span className="text-sm font-bold uppercase tracking-wide">Your Library</span>
          {user && (
            <button
              onClick={handleNewPlaylist}
              title="Create playlist"
              className="rounded-full p-1 hover:bg-spotify-hover hover:text-white"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="mt-2 space-y-1">
          <NavLink to="/liked" className={navClass}>
            <Heart className="h-5 w-5 text-spotify-green" /> Liked Songs
          </NavLink>
          {playlists.map((pl) => (
            <NavLink key={pl._id} to={`/playlist/${pl._id}`} className={navClass}>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-spotify-green text-[10px] font-bold text-black">
                {pl.tracks?.length || 0}
              </span>
              <span className="truncate">{pl.name}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-3 px-2">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spotify-green font-bold text-black">
                {user.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-spotify-text">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="rounded-full p-2 text-spotify-text hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:scale-105"
          >
            <LogIn className="h-4 w-4" /> Log in
          </NavLink>
        )}
      </div>
    </aside>
  )
}
