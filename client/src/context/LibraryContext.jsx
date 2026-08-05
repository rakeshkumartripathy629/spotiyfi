import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { libraryApi } from '../api/client'
import { useAuth } from './AuthContext'

const LibraryContext = createContext(null)

export function LibraryProvider({ children }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites([])
      setPlaylists([])
      setReady(true)
      return
    }
    try {
      const [f, p] = await Promise.all([libraryApi.favorites(), libraryApi.playlists()])
      setFavorites(f.tracks)
      setPlaylists(p.playlists)
    } catch {
      // ignore
    } finally {
      setReady(true)
    }
  }, [user])

  useEffect(() => {
    setReady(false)
    refresh()
  }, [refresh])

  const isFavorite = (id) => favorites.some((t) => t.id === String(id))

  const toggleFavorite = async (track) => {
    if (!user) return false
    if (isFavorite(track.id)) {
      const res = await libraryApi.removeFavorite(track.id)
      setFavorites(res.tracks)
      return false
    }
    const res = await libraryApi.addFavorite(track)
    setFavorites(res.tracks)
    return true
  }

  const createPlaylist = async (name) => {
    const res = await libraryApi.createPlaylist(name)
    setPlaylists((p) => [res.playlist, ...p])
    return res.playlist
  }

  const addToPlaylist = async (plId, track) => {
    const res = await libraryApi.addToPlaylist(plId, track)
    setPlaylists((p) => p.map((pl) => (pl._id === plId ? res.playlist : pl)))
    return res.playlist
  }

  const removeFromPlaylist = async (plId, trackId) => {
    const res = await libraryApi.removeFromPlaylist(plId, trackId)
    setPlaylists((p) => p.map((pl) => (pl._id === plId ? res.playlist : pl)))
    return res.playlist
  }

  const deletePlaylist = async (plId) => {
    await libraryApi.deletePlaylist(plId)
    setPlaylists((p) => p.filter((pl) => pl._id !== plId))
  }

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        playlists,
        ready,
        refresh,
        isFavorite,
        toggleFavorite,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        deletePlaylist,
      }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export const useLibrary = () => useContext(LibraryContext)
