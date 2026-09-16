import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import {
  Pizza,
  Layers,
  FileText,
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
  ExternalLink,
  ShieldCheck,
  Headphones,
  Menu,
  X,
  Store,
  Flame,
  Check
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string
  group: 'operacao' | 'gestao' | 'configuracoes'
}

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, pizzeria, signOut, signInDemo } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)

  const navItems: NavItem[] = [
    // Operação
    {
      label: 'Tela Unificada',
      path: '/unified-orders',
      icon: Layers,
      roles: ['owner_manager', 'attendant'],
      group: 'operacao'
    },
    {
      label: 'Fila da Cozinha',
      path: '/kitchen-queue',
      icon: ChefHat,
      roles: ['owner_manager', 'attendant', 'kitchen'],
      badge: profile?.role === 'kitchen' ? 'Foco Cozinha' : undefined,
      group: 'operacao'
    },
    {
      label: 'Detalhes do Pedido',
      path: '/order/demo-001',
      icon: FileText,
      roles: ['owner_manager', 'attendant', 'kitchen'],
      group: 'operacao'
    },
    {
      label: 'WhatsApp Inbox & IA',
      path: '/whatsapp-inbox',
      icon: MessageSquare,
      roles: ['owner_manager', 'attendant'],
      group: 'operacao'
    },
    {
      label: 'Estoque & Alertas',
      path: '/inventory',
      icon: Boxes,
      roles: ['owner_manager', 'attendant', 'kitchen'],
      group: 'operacao'
    },
    {
      label: 'Avaliações Deliveries',
      path: '/delivery-reviews',
      icon: Star,
      roles: ['owner_manager', 'attendant'],
      group: 'operacao'
    },

    // Gestão & IA (Apenas Dono/Gerente)
    {
      label: 'Cardápio Próprio',
      path: '/menu-management',
      icon: MenuSquare,
      roles: ['owner_manager'],
      group: 'gestao'
    },
    {
      label: 'Relatório Diário',
      path: '/reports-daily',
      icon: BarChart2,
      roles: ['owner_manager'],
      group: 'gestao'
    },
    {
      label: 'Relatório Semanal',
      path: '/reports-weekly',
      icon: TrendingUp,
      roles: ['owner_manager'],
      badge: 'IA',
      group: 'gestao'
    },

    // Configurações (Apenas Dono/Gerente)
    {
      label: 'Canais & Integrações',
      path: '/settings-channels',
      icon: Settings,
      roles: ['owner_manager'],
      group: 'configuracoes'
    },
    {
      label: 'Configurações IA',
      path: '/settings-ai',
      icon: Bot,
      roles: ['owner_manager'],
      group: 'configuracoes'
    },
    {
      label: 'Horários & Taxas',
      path: '/settings-hours',
      icon: Clock,
      roles: ['owner_manager'],
      group: 'configuracoes'
    },
    {
      label: 'Equipe & Papéis',
      path: '/settings-team',
      icon: Users,
      roles: ['owner_manager'],
      group: 'configuracoes'
    }
  ]

  // Filtra itens de acordo com o papel atual do usuário
  const userRole = profile?.role || 'owner_manager'
  const allowedItems = navItems.filter((item) => item.roles.includes(userRole))

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleSwitchRole = async (newRole: UserRole) => {
    setShowRoleSwitcher(false)
    await signInDemo(newRole)
    if (newRole === 'kitchen') {
      navigate('/kitchen-queue')
    } else {
      navigate('/unified-orders')
    }
  }

  const getRoleConfig = () => {
    switch (userRole) {
      case 'owner_manager':
        return {
          title: 'Dono / Gerente',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          icon: ShieldCheck,
          accentBg: 'bg-amber-500'
        }
      case 'attendant':
        return {
          title: 'Atendente',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          icon: Headphones,
          accentBg: 'bg-emerald-500'
        }
      case 'kitchen':
        return {
          title: 'Cozinha / Produção',
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
          icon: ChefHat,
          accentBg: 'bg-sky-500'
        }
    }
  }

  const roleConfig = getRoleConfig()
  const RoleIcon = roleConfig.icon

  const isItemActive = (path: string) => {
    if (path.startsWith('/order/')) {
      return location.pathname.startsWith('/order/')
    }
    return location.pathname === path
  }

  const renderNavGroup = (items: NavItem[], groupTitle?: string) => {
    if (items.length === 0) return null
    return (
      <div className="space-y-1 mb-4">
        {groupTitle && (
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {groupTitle}
          </div>
        )}
        {items.map((item) => {
          const Icon = item.icon
          const active = isItemActive(item.path)
          const isKitchenPriority = userRole === 'kitchen' && item.path === '/kitchen-queue'

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                active
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/20 font-semibold'
                  : isKitchenPriority
                  ? 'bg-sky-950/40 border border-sky-500/30 text-sky-200 hover:bg-sky-900/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    active ? 'text-white' : isKitchenPriority ? 'text-sky-400' : 'text-slate-400 group-hover:text-orange-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                    active
                      ? 'bg-white/20 text-white'
                      : isKitchenPriority
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    )
  }

  // Conteúdo do menu lateral
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-orange-400/30">
              <Pizza className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm text-white tracking-tight">PizzaHub</h1>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md border border-orange-500/20">
                  <Flame className="w-2.5 h-2.5" /> Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                {pizzeria?.name || 'Pizzaria Bella Napoli'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card do Usuário Logado & Papel */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${roleConfig.color}`}>
                <RoleIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {profile?.full_name || 'Usuário da Equipe'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {roleConfig.title}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="text-[10px] font-medium text-orange-400 hover:text-orange-300 underline underline-offset-2 ml-2 shrink-0 cursor-pointer"
              title="Alternar papel para testar o sistema"
            >
              Trocar
            </button>
          </div>

          {/* Menu Dropdown de Troca Rápida de Papel */}
          {showRoleSwitcher && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Simular Papel de Acesso:
              </div>
              <button
                onClick={() => handleSwitchRole('owner_manager')}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] text-left transition-colors ${
                  userRole === 'owner_manager' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Dono / Gerente (Acesso Total)</span>
                {userRole === 'owner_manager' && <Check className="w-3 h-3 text-amber-400" />}
              </button>
              <button
                onClick={() => handleSwitchRole('attendant')}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] text-left transition-colors ${
                  userRole === 'attendant' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Atendente (Operação & Pedidos)</span>
                {userRole === 'attendant' && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
              <button
                onClick={() => handleSwitchRole('kitchen')}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] text-left transition-colors ${
                  userRole === 'kitchen' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Cozinha (Foco Produção)</span>
                {userRole === 'kitchen' && <Check className="w-3 h-3 text-sky-400" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items (Filtrados por Papel) */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        {userRole === 'owner_manager' ? (
          <>
            {renderNavGroup(
              allowedItems.filter((i) => i.group === 'operacao'),
              'Operação Central'
            )}
            {renderNavGroup(
              allowedItems.filter((i) => i.group === 'gestao'),
              'Gestão & Relatórios IA'
            )}
            {renderNavGroup(
              allowedItems.filter((i) => i.group === 'configuracoes'),
              'Configurações'
            )}
          </>
        ) : (
          renderNavGroup(
            allowedItems,
            userRole === 'kitchen' ? 'Fila de Produção Cozinha' : 'Operação de Pedidos'
          )
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
        <Link
          to="/loja"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-xs text-orange-400 font-medium transition-all border border-orange-500/20 hover:border-orange-500/40 group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span>Site do Cliente (/loja)</span>
          </div>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-orange-400 transition-colors" />
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Sessão</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-orange-500 selection:text-white">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Pizza className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-tight">PizzaHub</h1>
            <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
              {pizzeria?.name || 'Pizzaria Bella Napoli'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleConfig.color}`}>
            {roleConfig.title}
          </span>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-800/80 bg-slate-900/70 backdrop-blur-xl shrink-0 flex-col justify-between sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-950 flex flex-col">
        {children}
      </main>
    </div>
  )
}
