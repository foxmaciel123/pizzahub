import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'

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
          <Route path="/" element={<Navigate to="/unified-orders" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/loja" element={<PublicStore />} />

          <Route path="/unified-orders" element={<UnifiedOrders />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/kitchen-queue" element={<KitchenQueue />} />
          <Route path="/menu-management" element={<MenuManagement />} />
          <Route path="/whatsapp-inbox" element={<WhatsappInbox />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/delivery-reviews" element={<DeliveryReviews />} />
          <Route path="/reports-daily" element={<ReportsDaily />} />
          <Route path="/reports-weekly" element={<ReportsWeekly />} />
          <Route path="/settings-channels" element={<SettingsChannels />} />
          <Route path="/settings-ai" element={<SettingsAi />} />
          <Route path="/settings-hours" element={<SettingsHours />} />
          <Route path="/settings-team" element={<SettingsTeam />} />

          <Route path="*" element={<Navigate to="/unified-orders" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
