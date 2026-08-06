import jwt from 'jsonwebtoken'

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!payload?.id) return res.status(401).json({ error: 'Invalid token' })
    req.authId = payload.id
    req.user = { _id: payload.id }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
