import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-orange-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-xs text-slate-400">Verificando sessão...</span>
      </div>
    )
  }

  if (!user || !profile || !profile.active) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    if (profile.role === 'kitchen') {
      return <Navigate to="/kitchen-queue" replace />
    }
    return <Navigate to="/unified-orders" replace />
  }

  return <>{children}</>
}
