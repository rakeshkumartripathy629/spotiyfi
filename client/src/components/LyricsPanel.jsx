import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { music } from '../api/client'
import { usePlayer } from '../context/PlayerContext'

function parseSynced(raw) {
  return raw
    .split('\n')
    .map((line) => {
      const m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/)
      if (!m) return null
      return { time: Number(m[1]) * 60 + Number(m[2]), text: m[3].trim() }
    })
    .filter(Boolean)
}

export default function LyricsPanel({ open, onClose }) {
  const { current, progress } = usePlayer()
  const [data, setData] = useState(null)
  const [state, setState] = useState('idle')
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (!current?.title) {
      setState('none')
      return
    }
    let alive = true
    setState('loading')
    setData(null)
    music
      .lyrics(current.title, current.artist || '')
      .then((res) => {
        if (!alive) return
        if (res.lyrics) {
          setData(res.lyrics)
          setState('ok')
        } else {
          setState('none')
        }
      })
      .catch(() => alive && setState('none'))
    return () => {
      alive = false
    }
  }, [open, current?.id, current?.title])

  const lines = useMemo(() => (data?.synced ? parseSynced(data.synced) : []), [data])

  const active = useMemo(() => {
    if (!lines.length) return -1
    let idx = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= progress) idx = i
      else break
    }
    return idx
  }, [lines, progress])

  useEffect(() => {
    if (active < 0 || !listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${active}"]`)
    el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  }, [active])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-spotify-card to-spotify-dark">
      <div className="flex items-center justify-between p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{current?.title}</p>
          <p className="truncate text-xs text-spotify-text">{current?.artist}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-spotify-text transition hover:bg-spotify-hover hover:text-white"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-40 pt-4">
        {state === 'loading' && (
          <p className="py-10 text-center text-sm text-spotify-text">Loading lyrics…</p>
        )}
        {state === 'none' && (
          <p className="py-10 text-center text-sm text-spotify-text">
            Lyrics not available for this track.
          </p>
        )}
        {state === 'ok' && lines.length > 0 && (
          <div className="space-y-3 text-center">
            {lines.map((l, i) => (
              <p
                key={i}
                data-idx={i}
                className={`text-lg transition-colors duration-300 ${
                  i === active
                    ? 'font-bold text-white'
                    : 'text-spotify-text'
                }`}
              >
                {l.text || '♪'}
              </p>
            ))}
          </div>
        )}
        {state === 'ok' && lines.length === 0 && data?.plain && (
          <div className="whitespace-pre-wrap text-center text-base text-white">
            {data.plain}
          </div>
        )}
      </div>
    </div>
  )
}
