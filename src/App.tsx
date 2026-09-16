import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
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

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Navigate to="/unified-orders" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/loja" element={<PublicStore />} />

          {/* Rotas Protegidas da Equipe Interna */}
          <Route
            path="/unified-orders"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant']}>
                <UnifiedOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:id"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant', 'kitchen']}>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen-queue"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant', 'kitchen']}>
                <KitchenQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu-management"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <MenuManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp-inbox"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant']}>
                <WhatsappInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant', 'kitchen']}>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-reviews"
            element={
              <ProtectedRoute allowedRoles={['owner_manager', 'attendant']}>
                <DeliveryReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports-daily"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <ReportsDaily />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports-weekly"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <ReportsWeekly />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings-channels"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <SettingsChannels />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings-ai"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <SettingsAi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings-hours"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <SettingsHours />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings-team"
            element={
              <ProtectedRoute allowedRoles={['owner_manager']}>
                <SettingsTeam />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
