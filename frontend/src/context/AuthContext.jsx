import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import API from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sm_user') || 'null')
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem('sm_token')
  })

  const [loading, setLoading] = useState(false)

  const saveAuth = (data) => {
    console.log('SAVING AUTH:', data)

    if (!data?.access_token) {
      throw new Error('Authentication token missing')
    }

    if (!data?.user) {
      throw new Error('User information missing')
    }

    const userData = {
      ...data.user,
      role: data.role || data.user.role,
    }

    setToken(data.access_token)
    setUser(userData)

    localStorage.setItem('sm_token', data.access_token)
    localStorage.setItem('sm_user', JSON.stringify(userData))
  }

  const login = async (payload) => {
    const { data } = await API.post('/auth/login', payload)

    console.log('API LOGIN DATA:', data)

    saveAuth(data)

    return data
  }

  const logout = () => {
    setUser(null)
    setToken(null)

    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
  }

  useEffect(() => {
    setLoading(false)
  }, [token, user])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,

        login,
        logout,
        saveAuth,

        isAuthenticated: !!token,

        isAdmin: user?.role === 'admin',
        isBuyer: user?.role === 'buyer',
        isVendor: user?.role === 'vendor',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}