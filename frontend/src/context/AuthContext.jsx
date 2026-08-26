import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await api.me()
      setUser(me)
    } catch (_) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = async (username, password) => {
    const me = await api.login(username, password)
    setUser(me)
    return me
  }

  const signup = async (payload) => {
    const me = await api.signup(payload)
    setUser(me)
    return me
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
