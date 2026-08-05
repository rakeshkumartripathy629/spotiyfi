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
  const volumeRef = useRef(0.8)
  const ytPlayerRef = useRef(null)
  const ytModeRef = useRef(false)
  const ytApiPromiseRef = useRef(null)

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

  function handleEndedIndex() {
    const q = queueRef.current
    if (!q.length) return 0
    if (repeatRef.current === 'one') {
      if (ytModeRef.current && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.seekTo(0, true)
          ytPlayerRef.current.playVideo()
        } catch {}
      } else {
        const a = audioRef.current
        a.currentTime = 0
        a.play().catch(() => {})
      }
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

  useEffect(() => {
    const audio = new Audio()
    audio.volume = volumeRef.current
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

  useEffect(() => {
    const iv = setInterval(() => {
      if (ytModeRef.current && ytPlayerRef.current) {
        try {
          const t = ytPlayerRef.current.getCurrentTime?.() || 0
          const d = ytPlayerRef.current.getDuration?.() || 0
          setProgress(t)
          if (d) setDuration(d)
        } catch {}
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  function loadYtApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT)
    if (ytApiPromiseRef.current) return ytApiPromiseRef.current
    ytApiPromiseRef.current = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev()
        resolve(window.YT)
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    })
    return ytApiPromiseRef.current
  }

  function ensureYtPlayer(YT) {
    if (ytPlayerRef.current) return
    const el = document.createElement('div')
    el.style.cssText =
      'position:fixed;left:0;top:0;width:0;height:0;opacity:0;pointer-events:none;overflow:hidden;'
    document.body.appendChild(el)
    const player = new YT.Player(el, {
      playerVars: { autoplay: 1, playsinline: 1, iv_load_policy: 3, rel: 0 },
      events: {
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) setIsPlaying(true)
          else if (e.data === YT.PlayerState.PAUSED) setIsPlaying(false)
          else if (e.data === YT.PlayerState.ENDED) {
            playAtRef.current && playAtRef.current(handleEndedIndex(), true)
          }
        },
      },
    })
    const onReady = () => {
      const iframe = player.getIframe?.()
      if (iframe) {
        iframe.style.cssText =
          'position:fixed;left:0;top:0;width:0;height:0;opacity:0;pointer-events:none;border:0;'
      }
    }
    if (player.getIframe?.()) onReady()
    else player.addEventListener?.('onReady', onReady)
    ytPlayerRef.current = player
  }

  useEffect(() => {
    let alive = true
    loadYtApi()
      .then((YT) => {
        if (alive) ensureYtPlayer(YT)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    return () => {
      try {
        ytPlayerRef.current?.destroy()
      } catch {}
      ytPlayerRef.current = null
    }
  }, [])

  async function playYoutube(videoId) {
    try {
      const YT = await loadYtApi()
      ensureYtPlayer(YT)
      ytModeRef.current = true
      setFullStatus('full')
      setProgress(0)
      setDuration(0)
      if (audioRef.current) audioRef.current.pause()
      ytPlayerRef.current.loadVideoById(videoId)
      try {
        ytPlayerRef.current.setVolume(Math.round(volumeRef.current * 100))
      } catch {}
    } catch {
      if (currentIdRef.current) {
        setFullStatus('preview')
        audioRef.current?.play().catch(() => setIsPlaying(false))
      }
    }
  }

  function recordRecent(track) {
    setRecent((prev) =>
      [track, ...prev.filter((t) => t.id !== String(track.id))].slice(0, 24)
    )
  }

  async function resolveFull(track) {
    try {
      const res = await api.post('/music/full', { title: track.title, artist: track.artist })
      if (currentIdRef.current !== String(track.id)) return
      if (res.youtubeId) {
        await playYoutube(res.youtubeId)
        return
      }
      if (res.url) {
        ytModeRef.current = false
        const a = audioRef.current
        a.src = res.url
        setFullStatus('full')
        setProgress(0)
        setDuration(0)
        a.play().catch(() => setIsPlaying(false))
        return
      }
      setFullStatus('preview')
      audioRef.current?.play().catch(() => setIsPlaying(false))
    } catch {
      if (currentIdRef.current === String(track.id)) {
        setFullStatus('preview')
        audioRef.current?.play().catch(() => setIsPlaying(false))
      }
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
    if (ytModeRef.current && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.stopVideo()
      } catch {}
    }
    ytModeRef.current = false
    const a = audioRef.current
    const needFull = !track.full && fullEnabledRef.current && track.title
    setFullStatus(track.full ? 'full' : needFull ? 'resolving' : 'preview')
    setProgress(0)
    setDuration(0)
    a.src = track.previewUrl
    a.pause()
    setIsPlaying(false)
    if (needFull) {
      resolveFull(track)
    } else {
      a.play().catch(() => setIsPlaying(false))
    }
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
    if (ytModeRef.current && ytPlayerRef.current) {
      try {
        const st = ytPlayerRef.current.getPlayerState()
        if (st === 1) ytPlayerRef.current.pauseVideo()
        else ytPlayerRef.current.playVideo()
      } catch {}
      return
    }
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
    const q = queueRef.current
    if (!q.length) return
    if (ytModeRef.current && ytPlayerRef.current) {
      try {
        if (ytPlayerRef.current.getCurrentTime() > 3) {
          ytPlayerRef.current.seekTo(0, true)
          return
        }
      } catch {}
    } else if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      return
    }
    const i = shuffleRef.current
      ? Math.floor(Math.random() * q.length)
      : indexRef.current - 1
    playAt(i, true)
  }

  function seek(t) {
    if (ytModeRef.current && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(t, true)
      } catch {}
      return
    }
    if (audioRef.current) audioRef.current.currentTime = t
  }

  function changeVolume(v) {
    volumeRef.current = v
    setVolume(v)
    if (ytModeRef.current && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(Math.round(v * 100))
      } catch {}
      return
    }
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
