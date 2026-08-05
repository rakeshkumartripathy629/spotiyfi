import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-spotify-dark px-6 text-center text-white">
          <p className="text-2xl font-bold">Oops, kuch galat ho gaya</p>
          <p className="text-sm text-spotify-text">App crash ho gaya — reload karke dobara try karo.</p>
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
