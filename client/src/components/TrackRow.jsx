import { useEffect, useRef, useState } from 'react'
import { Play, Heart, Plus, Check, Trash2 } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { formatTime, fallbackArtwork } from '../utils/format'

export default function TrackRow({ track, index, list, showAlbum = false, onRemove = null }) {
  const { playTracks } = usePlayer()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite, playlists, addToPlaylist, createPlaylist } = useLibrary()
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const popRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const fav = isFavorite(track.id)
  const added = (plId) =>
    playlists.find((p) => p._id === plId)?.tracks?.some((t) => t.id === String(track.id))

  const handleCreate = async () => {
    if (!newName.trim()) return
    const pl = await createPlaylist(newName.trim())
    await addToPlaylist(pl._id, track)
    setNewName('')
  }

  return (
    <div className="group grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 rounded-md px-3 py-2 hover:bg-spotify-hover md:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <div className="flex items-center justify-center">
        <span className="w-6 text-center text-sm text-spotify-text group-hover:hidden">
          {index + 1}
        </span>
        <button
          onClick={() => playTracks(list, index)}
          className="hidden text-spotify-green group-hover:block"
          title="Play"
        >
          <Play className="h-4 w-4 fill-current" />
        </button>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <img
          src={track.artwork || fallbackArtwork(track.title)}
          alt={track.title}
          className="h-10 w-10 shrink-0 rounded object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{track.title}</p>
          <p className="truncate text-xs text-spotify-text">{track.artist}</p>
        </div>
      </div>

      {showAlbum && (
        <div className="hidden truncate text-sm text-spotify-text md:block">{track.album}</div>
      )}

      <div className="flex items-center justify-end gap-1">
        <span className="mr-2 hidden text-xs text-spotify-text md:block">
          {track.duration ? formatTime(track.duration / 1000) : ''}
        </span>
        {user && (
          <button
            onClick={() => toggleFavorite(track)}
            className={`p-1 ${fav ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}
            title={fav ? 'Remove from Liked' : 'Like'}
          >
            <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
          </button>
        )}
        {user && (
          <div className="relative" ref={popRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="p-1 text-spotify-text hover:text-white"
              title="Add to playlist"
            >
              <Plus className="h-4 w-4" />
            </button>
            {open && (
              <div className="absolute bottom-8 right-0 z-30 w-56 rounded-lg border border-spotify-hover bg-spotify-card p-2 shadow-xl">
                <p className="px-2 py-1 text-xs font-bold uppercase text-spotify-text">
                  Add to playlist
                </p>
                <div className="max-h-40 overflow-y-auto">
                  {playlists.length === 0 && (
                    <p className="px-2 py-1 text-xs text-spotify-text">No playlists yet</p>
                  )}
                  {playlists.map((pl) => (
                    <button
                      key={pl._id}
                      onClick={() => {
                        if (!added(pl._id)) addToPlaylist(pl._id, track)
                      }}
                      className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-white hover:bg-spotify-hover"
                    >
                      <span className="truncate">{pl.name}</span>
                      {added(pl._id) && <Check className="h-3.5 w-3.5 shrink-0 text-spotify-green" />}
                    </button>
                  ))}
                </div>
                <div className="mt-1 flex gap-1 border-t border-spotify-hover pt-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="New playlist"
                    className="w-full rounded bg-spotify-hover px-2 py-1 text-xs text-white outline-none placeholder:text-spotify-text"
                  />
                  <button
                    onClick={handleCreate}
                    className="shrink-0 rounded bg-spotify-green px-2 text-xs font-bold text-black"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(track)}
            className="p-1 text-spotify-text hover:text-red-500"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
