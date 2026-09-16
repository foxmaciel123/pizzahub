import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Pizza,
  Layers,
  ChefHat,
  MenuSquare,
  MessageSquare,
  Boxes,
  Star,
  BarChart2,
  TrendingUp,
  Settings,
  Bot,
  Clock,
  Users,
  LogOut,
  ExternalLink
} from 'lucide-react'

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const navItems = [
    { label: 'Tela Unificada', path: '/unified-orders', icon: Layers, roles: ['owner_manager', 'attendant'] },
    { label: 'Fila da Cozinha', path: '/kitchen-queue', icon: ChefHat, roles: ['owner_manager', 'attendant', 'kitchen'] },
    { label: 'Cardápio Próprio', path: '/menu-management', icon: MenuSquare, roles: ['owner_manager'] },
    { label: 'WhatsApp Inbox', path: '/whatsapp-inbox', icon: MessageSquare, roles: ['owner_manager', 'attendant'] },
    { label: 'Estoque & Alertas', path: '/inventory', icon: Boxes, roles: ['owner_manager', 'attendant', 'kitchen'] },
    { label: 'Avaliações Deliveries', path: '/delivery-reviews', icon: Star, roles: ['owner_manager', 'attendant'] },
    { label: 'Relatório Diário', path: '/reports-daily', icon: BarChart2, roles: ['owner_manager'] },
    { label: 'Relatório Semanal', path: '/reports-weekly', icon: TrendingUp, roles: ['owner_manager'] },
    { label: 'Canais & Integrações', path: '/settings-channels', icon: Settings, roles: ['owner_manager'] },
    { label: 'Configurações IA', path: '/settings-ai', icon: Bot, roles: ['owner_manager'] },
    { label: 'Horários & Taxas', path: '/settings-hours', icon: Clock, roles: ['owner_manager'] },
    { label: 'Equipe & Papéis', path: '/settings-team', icon: Users, roles: ['owner_manager'] },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div className="p-4 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Pizza className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white tracking-tight">PizzaHub</h1>
              <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Central de Pedidos</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="mt-4 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="pt-4 mt-auto border-t border-slate-800 space-y-2">
            <Link
              to="/loja"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs text-orange-400 font-medium transition-colors border border-slate-700/50"
            >
              <span>Site do Cliente (/loja)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
