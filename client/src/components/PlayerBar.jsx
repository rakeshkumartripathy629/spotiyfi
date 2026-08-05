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
} from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { formatTime, fallbackArtwork } from '../utils/format'

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

  const badge =
    fullStatus === 'full' ? (
      <span className="rounded bg-spotify-green/20 px-1.5 py-0.5 text-[10px] font-bold text-spotify-green">
        FULL
      </span>
    ) : fullStatus === 'resolving' ? (
      <span className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> FULL
      </span>
    ) : (
      <span className="rounded bg-spotify-hover px-1.5 py-0.5 text-[10px] font-bold text-spotify-text">
        30s
      </span>
    )

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-spotify-hover bg-black px-4 py-2">
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
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current pl-0.5" />}
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
  )
}
