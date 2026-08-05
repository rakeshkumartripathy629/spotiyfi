import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.warn('[DB] MONGO_URI not set — skipping database connection. Music endpoints still work.')
    return
  }
  try {
    const t0 = Date.now()
    await mongoose.connect(uri, {
      family: 4,
      keepAlive: true,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      heartbeatFrequencyMS: 2000,
    })
    console.log(`[DB] MongoDB connected in ${Date.now() - t0}ms`)
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message)
  }
}
