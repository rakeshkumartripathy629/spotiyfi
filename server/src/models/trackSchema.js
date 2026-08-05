import mongoose from 'mongoose'

export const trackSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: String,
    artist: String,
    album: String,
    artwork: String,
    previewUrl: String,
    duration: Number,
    collectionId: String,
  },
  { _id: false }
)
