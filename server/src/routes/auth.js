import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email }
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' })
  const cleanName = String(name).trim()
  if (cleanName.length < 2 || cleanName.length > 50)
    return res.status(400).json({ error: 'Name must be 2-50 characters' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)))
    return res.status(400).json({ error: 'Invalid email address' })
  if (String(password).length < 6 || String(password).length > 72)
    return res.status(400).json({ error: 'Password must be 6-72 characters' })
  try {
    const exists = await User.findOne({ email: String(email).toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Email already registered' })
    const user = await User.create({
      name: cleanName,
      email,
      password: await bcrypt.hash(String(password), 10),
    })
    res.status(201).json({ token: signToken(user), user: publicUser(user) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const user = await User.findOne({ email: String(email).toLowerCase() })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  res.json({ token: signToken(user), user: publicUser(user) })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

export default router
