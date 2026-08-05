import mongoose from 'mongoose'
import { trackSchema } from './trackSchema.js'

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tracks: { type: [trackSchema], default: [] },
  },
  { timestamps: true }
)

export default mongoose.model('Playlist', playlistSchema)
