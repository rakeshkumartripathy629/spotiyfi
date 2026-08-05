import axios from 'axios'

const rawBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://sqotify-api.onrender.com')
const baseURL = rawBase.endsWith('/api') ? rawBase : rawBase.replace(/\/$/, '') + '/api'
const api = axios.create({ baseURL, timeout: 25000 })

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('sq_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const { config } = err
    const status = err.response?.status
    const retryable = !status || status === 502 || status === 503 || status === 504
    if (config && retryable && (config.__retryCount || 0) < 2) {
      config.__retryCount = (config.__retryCount || 0) + 1
      await new Promise((r) => setTimeout(r, 1000 * config.__retryCount))
      return api(config)
    }
    const msg = err.response?.data?.error || 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

export default api

export const music = {
  search: (q, country = 'IN', limit = 25) =>
    api.get('/music/search', { params: { q, country, limit } }),
  charts: (country = 'US', limit = 20) =>
    api.get('/music/charts', { params: { country, limit } }),
  album: (id) => api.get(`/music/album/${id}`),
  countries: () => api.get('/music/countries'),
  recent: (limit = 20) => api.get('/music/recent', { params: { limit } }),
  moods: () => api.get('/music/moods'),
  artistSongs: (q) => api.get('/music/artist-songs', { params: { q } }),
  jamendo: (q, limit = 24) => api.get('/music/jamendo', { params: { q, limit } }),
  full: (title, artist) => api.post('/music/full', { title, artist }),
  artist: (id) => api.get(`/music/artist/${id}`),
  lyrics: (title, artist) => api.get('/music/lyrics', { params: { title, artist } }),
  similar: (title, artist) => api.get('/music/similar', { params: { title, artist } }),
}

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const libraryApi = {
  favorites: () => api.get('/library/favorites'),
  addFavorite: (track) => api.post(`/library/favorites/${track.id}`, track),
  removeFavorite: (id) => api.delete(`/library/favorites/${id}`),
  history: () => api.get('/library/history'),
  addHistory: (track) => api.post('/library/history', track),
  playlists: () => api.get('/library/playlists'),
  createPlaylist: (name) => api.post('/library/playlists', { name }),
  playlist: (id) => api.get(`/library/playlists/${id}`),
  addToPlaylist: (id, track) => api.post(`/library/playlists/${id}/tracks`, track),
  removeFromPlaylist: (id, trackId) => api.delete(`/library/playlists/${id}/tracks/${trackId}`),
  deletePlaylist: (id) => api.delete(`/library/playlists/${id}`),
}
