import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sq_token')
    if (!token) return setLoading(false)
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('sq_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (data) => {
    const res = await authApi.login(data)
    localStorage.setItem('sq_token', res.token)
    setUser(res.user)
  }

  const register = async (data) => {
    const res = await authApi.register(data)
    localStorage.setItem('sq_token', res.token)
    setUser(res.user)
  }

  const logout = () => {
    localStorage.removeItem('sq_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
