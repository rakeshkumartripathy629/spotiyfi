import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PlayerProvider } from './context/PlayerContext'
import { LibraryProvider } from './context/LibraryContext'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'
import MobileNav from './components/MobileNav'
import TopBar from './components/TopBar'
import Home from './pages/Home'
import Search from './pages/Search'
import Charts from './pages/Charts'
import Album from './pages/Album'
import Artist from './pages/Artist'
import Playlist from './pages/Playlist'
import Liked from './pages/Liked'
import SongLink from './pages/SongLink'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'

function Loading() {
  return (
    <div className="flex h-full items-center justify-center text-spotify-text">
      Loading...
    </div>
  )
}

function Root() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Shell /> : <Landing />
}

function Shell() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="flex h-full flex-col bg-spotify-dark">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1 overflow-y-auto pb-36 md:pb-28">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/album/:id" element={<Album />} />
            <Route path="/artist/:id" element={<Artist />} />
            <Route path="/song/:id" element={<SongLink />} />
            <Route path="/playlist/:id" element={<Playlist />} />
            <Route path="/liked" element={user ? <Liked /> : <Navigate to="/login" />} />
          </Routes>
          </main>
        </div>
      </div>
      <MobileNav />
      <PlayerBar />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <LibraryProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Root />} />
            <Route path="/*" element={<Shell />} />
          </Routes>
        </LibraryProvider>
      </PlayerProvider>
    </AuthProvider>
  )
}
