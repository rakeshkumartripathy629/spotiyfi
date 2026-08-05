import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Music2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-black px-4 py-10">
      <div className="flex items-center gap-2 text-3xl font-bold">
        <Music2 className="h-8 w-8 text-spotify-green" />
        <span>
          Sqo<span className="text-spotify-green">tify</span>
        </span>
      </div>
      <form onSubmit={submit} className="mt-8 w-full max-w-sm rounded-lg bg-spotify-card p-8">
        <h1 className="mb-6 text-center text-2xl font-bold">Log in to Sqotify</h1>
        {error && (
          <p className="mb-4 rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-400">{error}</p>
        )}
        <label className="mb-1 block text-sm font-semibold text-spotify-text">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-spotify-hover bg-spotify-hover px-3 py-2.5 text-white outline-none focus:border-spotify-green"
        />
        <label className="mb-1 block text-sm font-semibold text-spotify-text">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-6 w-full rounded-md border border-spotify-hover bg-spotify-hover px-3 py-2.5 text-white outline-none focus:border-spotify-green"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-spotify-green py-2.5 font-bold text-black transition hover:scale-[1.02] disabled:opacity-50"
        >
          {busy ? 'Logging in...' : 'Log in'}
        </button>
        <p className="mt-4 text-center text-sm text-spotify-text">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-white underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
