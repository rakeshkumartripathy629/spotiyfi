import { NavLink } from 'react-router-dom'
import { Home, Search, Compass, Heart, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function MobileNav() {
  const { user, logout } = useAuth()
  const item = (p) => {
    const { isActive } = p || {}
    return `flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] font-semibold ${
      isActive ? 'text-spotify-green' : 'text-spotify-text'
    }`
  }

  return (
    <nav className="fixed inset-x-0 bottom-16 z-20 flex border-t border-spotify-hover bg-black md:hidden">
      <NavLink to="/" className={item} end>
        <Home className="h-5 w-5" /> Home
      </NavLink>
      <NavLink to="/search" className={item}>
        <Search className="h-5 w-5" /> Search
      </NavLink>
      <NavLink to="/charts" className={item}>
        <Compass className="h-5 w-5" /> Explore
      </NavLink>
      <NavLink to="/liked" className={item}>
        <Heart className="h-5 w-5" /> Liked
      </NavLink>
      {user ? (
        <button
          onClick={logout}
          className={`${item(null)}`}
          title="Log out"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-spotify-green text-[10px] font-bold text-black">
            {user.name?.[0]?.toUpperCase()}
          </span>
          Logout
        </button>
      ) : (
        <NavLink to="/login" className={item}>
          <LogIn className="h-5 w-5" /> Login
        </NavLink>
      )}
    </nav>
  )
}
