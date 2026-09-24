import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  console.log('PROTECTED ROUTE:', {
    isAuthenticated,
    user,
    requiredRole: role,
  })

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (role && user.role !== role) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    }

    if (user.role === 'buyer') {
      return <Navigate to="/buyer" replace />
    }

    if (user.role === 'vendor') {
      return <Navigate to="/vendor" replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}