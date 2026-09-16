import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  orderService,
  Order,
  OrderStatus,
  ChannelType
} from '@/services/orderService'
import {
  Layers,
  Search,
  PlusCircle,
  Clock,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChefHat,
  Truck,
  Check
} from 'lucide-react'

export const UnifiedOrders: React.FC = () => {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = orderService.subscribe((allOrders) => {
      const active = allOrders.filter((o) => o.is_active)
      setOrders(active)
    })
    return () => unsubscribe()
  }, [])

  // Efeito sonoro simplificado via Web Audio API para novos pedidos
  const playAlertSound = () => {
    if (!soundEnabled) return
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } catch (e) {}
  }

  const handleSimulateOrder = (channel: ChannelType) => {
    const created = orderService.injectSimulatedOrder(channel)
    playAlertSound()
    setNewOrderAlert(`Novo pedido recebido via ${channel.toUpperCase()}: ${created.external_order_id}`)
    setTimeout(() => setNewOrderAlert(null), 4000)
  }

  const handleConfirmOrder = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await orderService.confirmOrder(
        orderId,
        profile?.role || 'owner_manager',
        profile?.full_name || 'Atendente'
      )
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAdvanceStatus = async (orderId: string, toStatus: OrderStatus) => {
    setActionLoading(orderId)
    try {
      await orderService.advanceOrderStatus(
        orderId,
        toStatus,
        profile?.role || 'owner_manager',
        profile?.full_name || 'Atendente'
      )
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const getChannelBadge = (type: ChannelType) => {
    switch (type) {
      case 'ifood':
        return {
          label: 'iFood',
          bg: 'bg-red-500/10 text-red-400 border-red-500/30',
          dot: 'bg-red-500'
        }
      case '99food':
        return {
          label: '99Food',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500'
        }
      case 'keeta':
        return {
          label: 'Keeta',
          bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
          dot: 'bg-yellow-500'
        }
      case 'whatsapp':
        return {
          label: 'WhatsApp IA',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500'
        }
      case 'own_site':
        return {
          label: 'Site Próprio',
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          dot: 'bg-orange-500'
        }
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return { label: 'Novo', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' }
      case 'confirmed':
        return { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
      case 'in_preparation':
        return { label: 'Em Preparo', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
      case 'ready':
        return { label: 'Pronto p/ Despacho', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
      case 'out_for_delivery':
        return { label: 'Em Rota de Entrega', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
      case 'delivered':
        return { label: 'Entregue', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' }
      case 'canceled':
        return { label: 'Cancelado', color: 'bg-rose-900/40 text-rose-400 border-rose-800' }
    }
  }

  // Filtragem
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (channelFilter !== 'all' && order.channel_type !== channelFilter) return false
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      const matchExtId = order.external_order_id.toLowerCase().includes(q)
      const matchCustomer = order.customer?.name.toLowerCase().includes(q) || false
      const matchItems = order.items.some((i) => i.item_name.toLowerCase().includes(q))
      if (!matchExtId && !matchCustomer && !matchItems) return false
    }
    return true
  })

  // Contadores
  const countNew = orders.filter((o) => o.status === 'new').length
  const countConfirmed = orders.filter((o) => o.status === 'confirmed').length
  const countPrep = orders.filter((o) => o.status === 'in_preparation').length
  const countReady = orders.filter((o) => o.status === 'ready').length
  const countRoute = orders.filter((o) => o.status === 'out_for_delivery').length

  const formatElapsedTime = (isoString: string) => {
    const diffMin = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000))
    if (diffMin === 0) return 'agora há pouco'
    if (diffMin === 1) return 'há 1 min'
    return `há ${diffMin} min`
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* Banner de Notificação em Tempo Real */}
        {newOrderAlert && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white shadow-xl shadow-orange-600/30 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-xs font-bold">{newOrderAlert}</span>
            </div>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-md font-mono">Realtime Live</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-orange-500" />
                <span>Tela Unificada de Pedidos</span>
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Realtime Conectado</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Central única de todos os deliveries e canais próprios da pizzaria em tempo real.
            </p>
          </div>

          {/* Quick Simulators & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Ativar/Desativar som de alerta para novos pedidos"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">Som</span>
            </button>

            {/* Injetor de Teste de Novos Pedidos (Simula webhook de delivery) */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold px-2 uppercase tracking-wider hidden sm:inline">
                Simular Pedido:
              </span>
              <button
                onClick={() => handleSimulateOrder('ifood')}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg text-[11px] font-bold transition-all"
                title="Injetar pedido simulado do iFood"
              >
                + iFood
              </button>
              <button
                onClick={() => handleSimulateOrder('whatsapp')}
                className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all"
                title="Injetar pedido simulado do WhatsApp"
              >
                + WhatsApp
              </button>
              <button
                onClick={() => handleSimulateOrder('99food')}
                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all"
                title="Injetar pedido simulado do 99Food"
              >
                + 99
              </button>
              <button
                onClick={() => handleSimulateOrder('own_site')}
                className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 rounded-lg text-[11px] font-bold transition-all"
                title="Injetar pedido simulado do Site da Pizzaria"
              >
                + Site
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="space-y-3">
          {/* Status Tabs with Counters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Todos Ativos</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                statusFilter === 'new'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-300'
              }`}
            >
              <span>Novos</span>
              {countNew > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
                  {countNew}
                </span>
              )}
            </button>

            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                statusFilter === 'confirmed'
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Confirmados</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-mono">
                {countConfirmed}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('in_preparation')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                statusFilter === 'in_preparation'
                  ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Em Preparo</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-mono">
                {countPrep}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                statusFilter === 'ready'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Prontos</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-mono">
                {countReady}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('out_for_delivery')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                statusFilter === 'out_for_delivery'
                  ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Em Rota</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-mono">
                {countRoute}
              </span>
            </button>
          </div>

          {/* Search & Channel Chips */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por comanda #, cliente ou sabor..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Channel Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-500 font-bold uppercase text-[10px] mr-1 hidden md:inline">Canal:</span>
              {['all', 'ifood', 'whatsapp', 'own_site', '99food', 'keeta'].map((ch) => {
                const isSel = channelFilter === ch
                const labels: Record<string, string> = {
                  all: 'Todos',
                  ifood: 'iFood',
                  whatsapp: 'WhatsApp',
                  own_site: 'Site',
                  '99food': '99Food',
                  keeta: 'Keeta'
                }
                return (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      isSel
                        ? 'bg-slate-700 text-white border border-slate-600 font-bold'
                        : 'bg-slate-900/50 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {labels[ch]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Nenhum pedido ativo encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Nenhum pedido corresponde aos filtros selecionados. Novos pedidos que chegarem por delivery ou WhatsApp aparecerão aqui instantaneamente.
            </p>
            <button
              onClick={() => handleSimulateOrder('ifood')}
              className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/20"
            >
              Simular Pedido de Teste
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const chBadge = getChannelBadge(order.channel_type)
              const stBadge = getStatusBadge(order.status)
              const isLoading = actionLoading === order.id

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                    order.status === 'new'
                      ? 'bg-gradient-to-b from-rose-950/20 to-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/20'
                      : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-800/70 space-y-2">
                    <div className="flex items-center justify-between">
                      {/* Channel Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${chBadge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${chBadge.dot}`} />
                        <span>{chBadge.label}</span>
                      </span>

                      {/* External Order ID */}
                      <span className="text-xs font-mono font-bold text-white bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                        {order.external_order_id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 font-medium text-slate-300">
                        <span>{order.customer?.name || 'Cliente'}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-orange-400">
                          {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>{formatElapsedTime(order.received_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body - Item list */}
                  <div className="p-4 space-y-3 flex-1">
                    {/* Items */}
                    <div className="space-y-1.5 text-xs">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-white mr-1.5">{item.quantity}x</span>
                            <span className="text-slate-200">{item.item_name}</span>
                            {item.selected_options.length > 0 && (
                              <div className="text-[10px] text-orange-400 pl-4">
                                + {item.selected_options.map((o) => o.name).join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="text-slate-400 font-mono text-[11px] shrink-0">
                            R$ {(item.quantity * item.unit_price).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Customer Notes */}
                    {order.customer_notes && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-1.5 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="italic">{order.customer_notes}</span>
                      </div>
                    )}

                    {/* Address Preview if delivery */}
                    {order.delivery_type === 'delivery' && order.delivery_address.street && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {order.delivery_address.street}, {order.delivery_address.number} - {order.delivery_address.neighborhood}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total</span>
                        <span className="font-bold font-mono text-sm text-white">
                          R$ {order.total_amount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${stBadge.color}`}>
                        {stBadge.label}
                      </span>
                    </div>

                    {/* Action Buttons based on order status */}
                    <div className="flex items-center gap-2 pt-1">
                      {order.status === 'new' && (
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          disabled={isLoading}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>Aceitar Pedido</span>
                        </button>
                      )}

                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleAdvanceStatus(order.id, 'in_preparation')}
                          disabled={isLoading}
                          className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <ChefHat className="w-4 h-4" />
                          <span>Enviar p/ Cozinha</span>
                        </button>
                      )}

                      {order.status === 'in_preparation' && (
                        <button
                          onClick={() => handleAdvanceStatus(order.id, 'ready')}
                          disabled={isLoading}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Marcar Pronto</span>
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleAdvanceStatus(order.id, 'out_for_delivery')}
                          disabled={isLoading}
                          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Despachar / Em Rota</span>
                        </button>
                      )}

                      {order.status === 'out_for_delivery' && (
                        <button
                          onClick={() => handleAdvanceStatus(order.id, 'delivered')}
                          disabled={isLoading}
                          className="flex-1 py-2 px-3 bg-slate-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>Concluir Entrega</span>
                        </button>
                      )}

                      {/* Detail Link */}
                      <Link
                        to={`/order/${order.id}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Ver Comanda Completa"
                      >
                        <FileText className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
