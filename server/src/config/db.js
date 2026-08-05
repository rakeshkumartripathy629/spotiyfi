import mongoose from 'mongoose'

const RETRY_DELAY = 5000

async function attemptConnect() {
  const uri = process.env.MONGO_URI
  const t0 = Date.now()
  await mongoose.connect(uri, {
    keepAlive: true,
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    heartbeatFrequencyMS: 5000,
  })
  console.log(`[DB] MongoDB connected in ${Date.now() - t0}ms`)
}

export async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.warn('[DB] MONGO_URI not set — skipping database connection. Music endpoints still work.')
    return
  }
  mongoose.connection.on('error', (err) => {
    console.error('[DB] connection error:', err.message)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] disconnected — will reconnect on next attempt')
  })
  for (;;) {
    try {
      await attemptConnect()
      return
    } catch (err) {
      console.error(`[DB] MongoDB connection failed: ${err.message} — retrying in ${RETRY_DELAY}ms`)
      await new Promise((r) => setTimeout(r, RETRY_DELAY))
    }
  }
}
