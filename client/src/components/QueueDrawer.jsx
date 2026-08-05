import { X, Play, ListPlus, Trash2 } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { fallbackArtwork } from '../utils/format'

export default function QueueDrawer({ open, onClose }) {
  const { queue, queueIndex, playTracks, removeFromQueue, playNext } = usePlayer()

  if (!open) return null

  const upNext = queue.filter((_, i) => i > queueIndex)
  const history = queue.filter((_, i) => i < queueIndex)
  const current = queue[queueIndex]

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-spotify-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-spotify-hover p-4">
          <h2 className="text-lg font-bold text-white">Queue</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-spotify-text transition hover:bg-spotify-hover hover:text-white"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {current && (
            <section className="mb-5">
              <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-spotify-text">
                Now playing
              </h3>
              <QueueRow track={current} active />
            </section>
          )}

          {upNext.length > 0 && (
            <section className="mb-5">
              <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-spotify-text">
                Up next
              </h3>
              {upNext.map((t, i) => {
                const realIndex = queueIndex + 1 + i
                return (
                  <QueueRow
                    key={`${t.id}-${realIndex}`}
                    track={t}
                    onRemove={() => removeFromQueue(realIndex)}
                    onPlayNext={() => playNext(realIndex)}
                    onPlay={() => playTracks(queue, realIndex)}
                  />
                )
              })}
            </section>
          )}

          {history.length > 0 && (
            <section>
              <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-spotify-text">
                Play history
              </h3>
              {history.map((t, i) => (
                <QueueRow
                  key={`${t.id}-h${i}`}
                  track={t}
                  onPlay={() => playTracks(queue, i)}
                  muted
                />
              ))}
            </section>
          )}

          {queue.length === 0 && (
            <p className="py-10 text-center text-sm text-spotify-text">
              Queue is empty. Play something to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function QueueRow({ track, active = false, muted = false, onRemove, onPlayNext, onPlay }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md px-2 py-2 ${
        active ? 'bg-spotify-hover' : 'hover:bg-spotify-hover/60'
      }`}
    >
      <button
        onClick={onPlay}
        className="group relative shrink-0"
        title="Play"
      >
        <img
          src={track.artwork || fallbackArtwork(track.title)}
          alt={track.title}
          className={`h-10 w-10 rounded object-cover ${active ? 'opacity-70' : ''}`}
        />
        {!active && (
          <span className="absolute inset-0 hidden items-center justify-center rounded bg-black/50 group-hover:flex">
            <Play className="h-4 w-4 fill-current text-white" />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${active ? 'text-spotify-green' : muted ? 'text-spotify-text' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="truncate text-xs text-spotify-text">{track.artist}</p>
      </div>
      {!active && onPlayNext && (
        <button
          onClick={onPlayNext}
          className="rounded p-1.5 text-spotify-text transition hover:text-white"
          title="Play next"
        >
          <ListPlus className="h-4 w-4" />
        </button>
      )}
      {!active && onRemove && (
        <button
          onClick={onRemove}
          className="rounded p-1.5 text-spotify-text transition hover:text-red-500"
          title="Remove from queue"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
