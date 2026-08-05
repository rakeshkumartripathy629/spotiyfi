import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '', stack: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: String(error?.message || error), stack: String(error?.stack || '') }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-spotify-dark px-6 py-10 text-center text-white">
          <p className="text-2xl font-bold">Oops, kuch galat ho gaya</p>
          <p className="text-sm text-spotify-text">App crash ho gaya — reload karke dobara try karo.</p>
          <p className="max-w-md break-all rounded-md bg-spotify-card px-4 py-2 font-mono text-xs text-red-400">
            {this.state.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-spotify-green px-6 py-2.5 font-bold text-black transition hover:scale-105"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
