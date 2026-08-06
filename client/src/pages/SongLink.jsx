import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { music } from '../api/client'
import { usePlayer } from '../context/PlayerContext'

export default function SongLink() {
  const { id } = useParams()
  const { playTrack } = usePlayer()
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    music
      .track(id)
      .then((res) => {
        if (!alive) return
        if (res.track?.previewUrl) {
          playTrack(res.track)
          setDone(true)
        } else {
          setError(true)
        }
      })
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [id, playTrack])

  if (done) return <Navigate to="/" replace />
  if (error)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-spotify-text">Ye gaana nahi mil paya.</p>
        <a href="/" className="rounded-full bg-spotify-green px-5 py-2 font-bold text-black">
          Home par jao
        </a>
      </div>
    )
  return (
    <div className="flex h-full items-center justify-center text-spotify-text">
      Gaana khol rahe hain...
    </div>
  )
}
