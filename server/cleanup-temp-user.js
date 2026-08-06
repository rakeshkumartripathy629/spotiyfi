import 'dotenv/config'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({ name: String, email: String, password: String }, { strict: false })
const M = mongoose.models.User || mongoose.model('User', userSchema)
await mongoose.connect(process.env.MONGO_URI)
const res = await M.deleteOne({ email: 'tempverify@sqotify.dev' })
console.log('deleted:', res.deletedCount)
await mongoose.disconnect()
process.exit(0)
