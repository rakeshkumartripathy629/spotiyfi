import { createContext, useContext, useEffect, useRef, useState } from 'react'
import api from '../api/client'

const PlayerContext = createContext(null)

const RECENT_KEY = 'sq_recent'
const FULL_KEY = 'sq_full'

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const queueRef = useRef([])
  const indexRef = useRef(-1)
  const repeatRef = useRef('off')
  const shuffleRef = useRef(false)
  const currentIdRef = useRef(null)
  const fullEnabledRef = useRef(localStorage.getItem(FULL_KEY) !== '0')
  const playAtRef = useRef(null)

  const [current, setCurrent] = useState(null)
  const [queue, setQueue] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [fullStatus, setFullStatus] = useState('preview')
  const [fullEnabled, setFullEnabled] = useState(fullEnabledRef.current)
  const [recent, setRecent] = useState(() =>
    JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  )

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  }, [recent])

  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.8
    audio.preload = 'auto'
    audioRef.current = audio

    const onTime = () => {
      setProgress(audio.currentTime)
      if (audio.duration) setDuration(audio.duration)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => playAtRef.current && playAtRef.current(handleEndedIndex(), true)
    const onError = () => setIsPlaying(false)

    function handleEndedIndex() {
      const q = queueRef.current
      if (!q.length) return 0
      if (repeatRef.current === 'one') {
        const a = audioRef.current
        a.currentTime = 0
        a.play().catch(() => {})
        return null
      }
      if (indexRef.current >= q.length - 1) {
        if (repeatRef.current === 'all') return 0
        setIsPlaying(false)
        setProgress(0)
        return null
      }
      return indexRef.current + 1
    }

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audio.pause()
    }
  }, [])

  function recordRecent(track) {
    setRecent((prev) =>
      [track, ...prev.filter((t) => t.id !== String(track.id))].slice(0, 24)
    )
  }

  async function resolveFull(track) {
    try {
      const res = await api.post('/music/full', { title: track.title, artist: track.artist })
      if (currentIdRef.current !== String(track.id)) return
      const a = audioRef.current
      a.src = res.url
      setFullStatus('full')
      setProgress(0)
      setDuration(0)
      a.play().catch(() => setIsPlaying(false))
    } catch {
      if (currentIdRef.current === String(track.id)) setFullStatus('preview')
    }
  }

  function playAt(i, auto) {
    const q = queueRef.current
    if (!q.length) return
    const idx = (((i % q.length) + q.length) % q.length)
    indexRef.current = idx
    const track = q[idx]
    currentIdRef.current = String(track.id)
    setCurrent(track)
    setQueue(q)
    recordRecent(track)
    const a = audioRef.current
    setFullStatus(fullEnabledRef.current ? 'resolving' : 'preview')
    setProgress(0)
    setDuration(0)
    a.src = track.previewUrl
    a.play().catch(() => setIsPlaying(false))
    if (fullEnabledRef.current && track.title) resolveFull(track)
  }
  playAtRef.current = playAt

  function playTracks(tracks, startIndex = 0) {
    const withUrls = tracks.filter((t) => t.previewUrl)
    if (!withUrls.length) return
    queueRef.current = withUrls
    let start = startIndex
    if (shuffleRef.current && withUrls.length > 1) start = Math.floor(Math.random() * withUrls.length)
    playAt(start, false)
  }

  function playTrack(track) {
    if (!track.previewUrl) return
    queueRef.current = [track]
    playAt(0, false)
  }

  function togglePlay() {
    const a = audioRef.current
    if (!a || !current) return
    if (a.paused) a.play().catch(() => setIsPlaying(false))
    else a.pause()
  }

  function next() {
    const q = queueRef.current
    if (!q.length) return
    const i = shuffleRef.current
      ? Math.floor(Math.random() * q.length)
      : indexRef.current + 1
    playAt(i, true)
  }

  function prev() {
    const a = audioRef.current
    const q = queueRef.current
    if (!q.length) return
    if (a.currentTime > 3) {
      a.currentTime = 0
      return
    }
    const i = shuffleRef.current
      ? Math.floor(Math.random() * q.length)
      : indexRef.current - 1
    playAt(i, true)
  }

  function seek(t) {
    if (audioRef.current) audioRef.current.currentTime = t
  }

  function changeVolume(v) {
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  function toggleShuffle() {
    shuffleRef.current = !shuffleRef.current
    setShuffle(shuffleRef.current)
  }

  function toggleRepeat() {
    const order = ['off', 'all', 'one']
    const next = order[(order.indexOf(repeatRef.current) + 1) % order.length]
    repeatRef.current = next
    setRepeat(next)
  }

  function toggleFull() {
    const next = !fullEnabledRef.current
    fullEnabledRef.current = next
    localStorage.setItem(FULL_KEY, next ? '1' : '0')
    setFullEnabled(next)
    if (!next) setFullStatus('preview')
  }

  function addToQueue(track) {
    if (!track?.previewUrl) return
    const nq = [...queueRef.current, track]
    queueRef.current = nq
    setQueue(nq)
  }

  return (
    <PlayerContext.Provider
      value={{
        current,
        queue,
        isPlaying,
        progress,
        duration,
        volume,
        shuffle,
        repeat,
        fullStatus,
        fullEnabled,
        recent,
        playTracks,
        playTrack,
        togglePlay,
        next,
        prev,
        seek,
        changeVolume,
        toggleShuffle,
        toggleRepeat,
        toggleFull,
        addToQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
