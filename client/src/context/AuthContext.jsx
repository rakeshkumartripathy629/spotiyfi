import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let token = null
    try {
      token = localStorage.getItem('sq_token')
    } catch {}
    if (!token) return setLoading(false)
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        try {
          localStorage.removeItem('sq_token')
        } catch {}
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (data) => {
    const res = await authApi.login(data)
    try {
      localStorage.setItem('sq_token', res.token)
    } catch {}
    setUser(res.user)
  }

  const register = async (data) => {
    const res = await authApi.register(data)
    try {
      localStorage.setItem('sq_token', res.token)
    } catch {}
    setUser(res.user)
  }

  const logout = () => {
    try {
      localStorage.removeItem('sq_token')
    } catch {}
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
