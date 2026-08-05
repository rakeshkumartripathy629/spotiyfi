import { Link } from 'react-router-dom'
import { Music2, Radio, Mic2, ListMusic, ShieldCheck } from 'lucide-react'

const FEATURES = [
  { icon: Radio, title: 'Full songs', desc: 'Sirf 30s preview nahi — pura gaana, YouTube se.' },
  { icon: Mic2, title: 'Lyrics', desc: 'Chalte gaane ke sath synced lyrics highlight.' },
  { icon: ListMusic, title: 'Queue & artists', desc: 'Apna queue, artist pages, sab kuch.' },
  { icon: ShieldCheck, title: '100% private', desc: 'Har user sirf apna data dekhta hai — history, likes, playlists.' },
]

export default function Landing() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-spotify-hover via-spotify-dark to-black px-6 py-14">
      <div className="flex items-center gap-3 text-4xl font-bold text-white">
        <Music2 className="h-10 w-10 text-spotify-green" />
        <span>
          Sqo<span className="text-spotify-green">tify</span>
        </span>
      </div>
      <p className="mt-4 max-w-md text-center text-lg text-spotify-text">
        Apna gaana, apna sab kuch. Full songs, lyrics aur private playlists — sab kuch ek account ke sath.
      </p>

      <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-start gap-3 rounded-lg bg-spotify-card/70 p-4">
            <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-spotify-green" />
            <div>
              <p className="font-bold text-white">{f.title}</p>
              <p className="text-sm text-spotify-text">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          to="/register"
          className="rounded-full bg-spotify-green px-8 py-3 font-bold text-black transition hover:scale-105"
        >
          Create account
        </Link>
        <Link
          to="/login"
          className="rounded-full border border-spotify-hover px-8 py-3 font-bold text-white transition hover:border-white"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}
