export function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function fallbackArtwork(title = '') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title || 'Music')}&background=1db954&color=fff&size=300`
}

export const pad = (n) => String(n).padStart(2, '0')
