import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import { Login } from '@/pages/Login'
import { UnifiedOrders } from '@/pages/UnifiedOrders'
import { OrderDetail } from '@/pages/OrderDetail'
import { KitchenQueue } from '@/pages/KitchenQueue'
import { MenuManagement } from '@/pages/MenuManagement'
import { WhatsappInbox } from '@/pages/WhatsappInbox'
import { Inventory } from '@/pages/Inventory'
import { DeliveryReviews } from '@/pages/DeliveryReviews'
import { ReportsDaily } from '@/pages/ReportsDaily'
import { ReportsWeekly } from '@/pages/ReportsWeekly'
import { SettingsChannels } from '@/pages/SettingsChannels'
import { SettingsAi } from '@/pages/SettingsAi'
import { SettingsHours } from '@/pages/SettingsHours'
import { SettingsTeam } from '@/pages/SettingsTeam'
import { PublicStore } from '@/pages/PublicStore'

// Redirecionamento inicial baseado no papel da equipe
const IndexRedirect: React.FC = () => {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (profile.role === 'kitchen') {
    return <Navigate to="/kitchen-queue" replace />
  }

  return <Navigate to="/unified-orders" replace />
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<IndexRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/loja" element={<PublicStore />} />

          {/* 1. Tela Unificada (Dono/Gerente e Atendente) */}
          <Route
            path="/unified-orders"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant']}>
                <UnifiedOrders />
              </ProtectedRoute>
            }
          />

          {/* 2. Detalhe do Pedido (Todos da Equipe) */}
          <Route
            path="/order/:id"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant', 'kitchen']}>
                <OrderDetail />
              </ProtectedRoute>
            }
          />

          {/* 3. Fila da Cozinha (Foco Cozinha + Atendente e Gerente) */}
          <Route
            path="/kitchen-queue"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant', 'kitchen']}>
                <KitchenQueue />
              </ProtectedRoute>
            }
          />

          {/* 4. Cardápio Próprio (Apenas Dono/Gerente) */}
          <Route
            path="/menu-management"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <MenuManagement />
              </ProtectedRoute>
            }
          />

          {/* 5. WhatsApp Inbox & IA (Dono/Gerente e Atendente) */}
          <Route
            path="/whatsapp-inbox"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant']}>
                <WhatsappInbox />
              </ProtectedRoute>
            }
          />

          {/* 6. Estoque & Alertas (Todos da Equipe) */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant', 'kitchen']}>
                <Inventory />
              </ProtectedRoute>
            }
          />

          {/* 7. Avaliações Deliveries (Dono/Gerente e Atendente) */}
          <Route
            path="/delivery-reviews"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant']}>
                <DeliveryReviews />
              </ProtectedRoute>
            }
          />

          {/* 8. Relatório Diário (Apenas Dono/Gerente) */}
          <Route
            path="/reports-daily"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <ReportsDaily />
              </ProtectedRoute>
            }
          />

          {/* 9. Relatório Semanal com IA (Apenas Dono/Gerente) */}
          <Route
            path="/reports-weekly"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <ReportsWeekly />
              </ProtectedRoute>
            }
          />

          {/* 10. Canais & Integrações (Apenas Dono/Gerente) */}
          <Route
            path="/settings-channels"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <SettingsChannels />
              </ProtectedRoute>
            }
          />

          {/* 11. Configurações da IA (Apenas Dono/Gerente) */}
          <Route
            path="/settings-ai"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <SettingsAi />
              </ProtectedRoute>
            }
          />

          {/* 12. Horários & Taxas (Apenas Dono/Gerente) */}
          <Route
            path="/settings-hours"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <SettingsHours />
              </ProtectedRoute>
            }
          />

          {/* 13. Equipe & Papéis (Apenas Dono/Gerente) */}
          <Route
            path="/settings-team"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <SettingsTeam />
              </ProtectedRoute>
            }
          />

          {/* Fallback de rota inexistente */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
