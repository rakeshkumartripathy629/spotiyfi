import { useEffect, useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Music2,
  Radio,
  Loader2,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Mic2,
} from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { formatTime, fallbackArtwork } from '../utils/format'
import LyricsPanel from './LyricsPanel'
import QueueDrawer from './QueueDrawer'

function FullBadge({ fullStatus }) {
  if (fullStatus === 'full')
    return (
      <span className="rounded bg-spotify-green/20 px-1.5 py-0.5 text-[10px] font-bold text-spotify-green">
        FULL
      </span>
    )
  if (fullStatus === 'resolving')
    return (
      <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> FULL
      </span>
    )
  return (
    <span className="rounded bg-spotify-hover px-1.5 py-0.5 text-[10px] font-bold text-spotify-text">
      30s
    </span>
  )
}

export default function PlayerBar() {
  const {
    current,
    isPlaying,
    progress,
    duration,
    volume,
    shuffle,
    repeat,
    fullStatus,
    fullEnabled,
    togglePlay,
    next,
    prev,
    seek,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
    toggleFull,
  } = usePlayer()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const badge = <FullBadge fullStatus={fullStatus} />

  const playIcon = isPlaying ? (
    <Pause className="h-6 w-6 fill-current" />
  ) : (
    <Play className="h-6 w-6 fill-current pl-0.5" />
  )

  return (
    <>
      {/* Desktop player */}
      <div className="fixed inset-x-0 bottom-0 z-20 hidden border-t border-spotify-hover bg-black px-4 py-2 md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {current ? (
              <>
                <img
                  src={current.artwork || fallbackArtwork(current.title)}
                  alt={current.title}
                  className="h-14 w-14 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{current.title}</p>
                    {badge}
                  </div>
                  <p className="truncate text-xs text-spotify-text">{current.artist}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-spotify-card">
                  <Music2 className="h-6 w-6 text-spotify-text" />
                </div>
                <div className="text-sm text-spotify-text">
                  <p className="font-semibold text-white">Nothing playing</p>
                  <p className="text-xs">Pick a song to start</p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={`transition ${shuffle ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button onClick={prev} className="text-spotify-text hover:text-white" title="Previous">
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
              <button
                onClick={togglePlay}
                disabled={!current}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-40"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current pl-0.5" />
                )}
              </button>
              <button onClick={next} className="text-spotify-text hover:text-white" title="Next">
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
              <button
                onClick={toggleRepeat}
                className={`transition ${repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-text hover:text-white'}`}
                title={`Repeat: ${repeat}`}
              >
                {repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <span className="w-9 text-right text-[11px] text-spotify-text">{formatTime(progress)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={(e) => seek(Number(e.target.value))}
                className="h-1 w-full cursor-pointer accent-spotify-green"
              />
              <span className="w-9 text-[11px] text-spotify-text">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setLyricsOpen(true)}
              disabled={!current}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold text-spotify-text transition hover:text-white disabled:opacity-40"
              title="Lyrics"
            >
              <Mic2 className="h-3.5 w-3.5" /> Lyrics
            </button>
            <button
              onClick={() => setQueueOpen(true)}
              className="rounded-full p-1.5 text-spotify-text transition hover:text-white"
              title="Queue"
            >
              <ListMusic className="h-5 w-5" />
            </button>
            <button
              onClick={toggleFull}
              title={fullEnabled ? 'Full tracks ON — resolve full song' : 'Full tracks OFF — 30s previews'}
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition ${
                fullEnabled
                  ? 'bg-spotify-green/20 text-spotify-green'
                  : 'bg-spotify-hover text-spotify-text hover:text-white'
              }`}
            >
              <Radio className="h-3 w-3" /> Full
            </button>
            <Volume2 className="h-4 w-4 text-spotify-text" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="h-1 w-24 cursor-pointer accent-spotify-green"
            />
          </div>
        </div>
      </div>

      {/* Mobile mini player */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center gap-3 border-t border-spotify-hover bg-black px-3 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {current ? (
            <>
              <img
                src={current.artwork || fallbackArtwork(current.title)}
                alt={current.title}
                className="h-11 w-11 shrink-0 rounded object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{current.title}</p>
                <p className="flex items-center gap-1.5 truncate text-xs text-spotify-text">
                  {current.artist}
                  {badge}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-spotify-card">
                <Music2 className="h-5 w-5 text-spotify-text" />
              </div>
              <div className="text-sm text-spotify-text">
                <p className="font-semibold text-white">Nothing playing</p>
                <p className="text-xs">Pick a song to start</p>
              </div>
            </>
          )}
        </button>
        <button
          onClick={togglePlay}
          disabled={!current}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-40"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current pl-0.5" />
          )}
        </button>
        <button
          onClick={next}
          disabled={!current}
          className="shrink-0 text-white disabled:opacity-40"
          title="Next"
        >
          <SkipForward className="h-6 w-6 fill-current" />
        </button>
        <button
          onClick={() => setQueueOpen(true)}
          className="shrink-0 text-spotify-text"
          title="Queue"
        >
          <ListMusic className="h-6 w-6" />
        </button>
        <button
          onClick={() => setMobileOpen(true)}
          className="shrink-0 text-spotify-text"
          title="Open player"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile full-screen player */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-spotify-hover via-spotify-dark to-black md:hidden">
          <div className="flex items-center justify-between px-6 pt-10">
            <button
              onClick={() => setMobileOpen(false)}
              className="text-spotify-text"
              title="Close"
            >
              <ChevronDown className="h-7 w-7" />
            </button>
            <p className="text-xs font-bold uppercase tracking-widest text-spotify-text">
              Now Playing
            </p>
            <div className="w-7" />
          </div>

          {current ? (
            <>
              <div className="flex flex-1 items-center justify-center px-8 py-6">
                <img
                  src={current.artwork || fallbackArtwork(current.title)}
                  alt={current.title}
                  className="aspect-square w-full max-w-sm rounded-xl object-cover shadow-2xl"
                />
              </div>

              <div className="flex flex-col gap-6 px-8 pb-10">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-2xl font-bold text-white">{current.title}</h1>
                    {badge}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="truncate text-base text-spotify-text">{current.artist}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setLyricsOpen(true)}
                        className="flex items-center gap-1 rounded-full bg-spotify-hover px-3 py-1.5 text-xs font-bold text-white"
                        title="Lyrics"
                      >
                        <Mic2 className="h-4 w-4" /> Lyrics
                      </button>
                      <button
                        onClick={() => setQueueOpen(true)}
                        className="rounded-full bg-spotify-hover p-1.5 text-white"
                        title="Queue"
                      >
                        <ListMusic className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-9 text-right text-[11px] text-spotify-text">
                    {formatTime(progress)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={progress}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer accent-spotify-green"
                  />
                  <span className="w-9 text-[11px] text-spotify-text">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleShuffle}
                    className={shuffle ? 'text-spotify-green' : 'text-spotify-text'}
                    title="Shuffle"
                  >
                    <Shuffle className="h-6 w-6" />
                  </button>
                  <button onClick={prev} className="text-white" title="Previous">
                    <SkipBack className="h-9 w-9 fill-current" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-lg"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {playIcon}
                  </button>
                  <button onClick={next} className="text-white" title="Next">
                    <SkipForward className="h-9 w-9 fill-current" />
                  </button>
                  <button
                    onClick={toggleRepeat}
                    className={repeat !== 'off' ? 'text-spotify-green' : 'text-spotify-text'}
                    title={`Repeat: ${repeat}`}
                  >
                    {repeat === 'one' ? (
                      <Repeat1 className="h-6 w-6" />
                    ) : (
                      <Repeat className="h-6 w-6" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={toggleFull}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                      fullEnabled
                        ? 'bg-spotify-green/20 text-spotify-green'
                        : 'bg-spotify-hover text-spotify-text'
                    }`}
                    title={fullEnabled ? 'Full tracks ON' : 'Full tracks OFF — 30s previews'}
                  >
                    <Radio className="h-3.5 w-3.5" /> Full tracks
                  </button>
                  <div className="flex flex-1 items-center gap-2">
                    <Volume2 className="h-5 w-5 text-spotify-text" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => changeVolume(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer accent-spotify-green"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-spotify-text">
              Pick a song to start
            </div>
          )}
        </div>
      )}

      <LyricsPanel open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  )
}
