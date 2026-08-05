import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.warn('[DB] MONGO_URI not set — skipping database connection. Music endpoints still work.')
    return
  }
  try {
    await mongoose.connect(uri)
    console.log('[DB] MongoDB connected')
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message)
  }
}
