import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import musicRouter from './routes/music.js'
import authRouter from './routes/auth.js'
import libraryRouter from './routes/library.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'sqotify-api', time: new Date().toISOString() })
})

app.use('/api/music', musicRouter)
app.use('/api/auth', authRouter)
app.use('/api/library', libraryRouter)

app.use((req, res) => res.status(404).json({ error: 'Not found' }))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  connectDB()
})
