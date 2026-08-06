import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import { connectDB, mongoStatus } from './config/db.js'
import musicRouter from './routes/music.js'
import authRouter from './routes/auth.js'
import libraryRouter from './routes/library.js'

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err?.message || err)
})

const app = express()

app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(compression())

const CLIENT_URL = process.env.CLIENT_URL || 'https://sqotify-web.onrender.com'
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '1mb' }))

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
})
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
})
const fullLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api', globalLimiter)
app.use('/api/auth', authLimiter)
app.use('/api/music/full', fullLimiter)

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'sqotify-api',
    mongo: mongoStatus,
    readyState: mongoose.connection.readyState,
    time: new Date().toISOString(),
  })
})

app.use('/api/music', musicRouter)
app.use('/api/auth', authRouter)
app.use('/api/library', libraryRouter)

app.use((req, res) => res.status(404).json({ error: 'Not found' }))

app.use((err, req, res, next) => {
  console.error('[ERR]', err?.message || err)
  res.status(err?.status || 500).json({ error: 'Something went wrong' })
})

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  connectDB()
})
server.timeout = 30000
