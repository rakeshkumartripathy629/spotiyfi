import { useEffect, useRef, useState } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function TopBar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <header className="relative z-20 flex items-center justify-end border-b border-spotify-hover/60 bg-spotify-dark/95 px-4 py-2 md:px-6">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-spotify-hover"
          title="Account"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-spotify-green text-sm font-bold text-black">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </span>
          <span className="hidden max-w-[120px] truncate text-sm font-semibold text-white sm:block">
            {user?.name || 'User'}
          </span>
          <ChevronDown className="h-4 w-4 text-spotify-text" />
        </button>
        {open && (
          <div className="absolute right-0 top-12 w-56 rounded-lg border border-spotify-hover bg-spotify-card p-2 shadow-xl">
            <div className="border-b border-spotify-hover px-2 pb-2">
              <p className="truncate text-sm font-bold text-white">{user?.name}</p>
              <p className="truncate text-xs text-spotify-text">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="mt-1 flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-white transition hover:bg-spotify-hover"
            >
              <LogOut className="h-4 w-4 text-spotify-text" /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
