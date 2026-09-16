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
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Check
} from 'lucide-react'

export const KitchenQueue: React.FC = () => {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [filterStage, setFilterStage] = useState<'all' | 'confirmed' | 'in_preparation'>('all')
  const [fullscreen, setFullscreen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = orderService.subscribe((allOrders) => {
      // Cozinha acompanha pedidos confirmados e em preparo
      const queue = allOrders.filter(
        (o) => o.is_active && (o.status === 'confirmed' || o.status === 'in_preparation')
      )
      setOrders(queue)
    })
    return () => unsubscribe()
  }, [])

  const handleStartPrep = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await orderService.advanceOrderStatus(
        orderId,
        'in_preparation',
        profile?.role || 'kitchen',
        profile?.full_name || 'Cozinha'
      )
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkReady = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await orderService.advanceOrderStatus(
        orderId,
        'ready',
        profile?.role || 'kitchen',
        profile?.full_name || 'Cozinha'
      )
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
      setFullscreen(false)
    }
  }

  const getChannelColor = (type: ChannelType) => {
    switch (type) {
      case 'ifood':
        return 'text-red-400 bg-red-500/10 border-red-500/30'
      case '99food':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      case 'keeta':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'whatsapp':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      case 'own_site':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    }
  }

  const getMinutesElapsed = (isoString: string) => {
    return Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000))
  }

  const filteredOrders = orders.filter((o) => {
    if (filterStage === 'confirmed') return o.status === 'confirmed'
    if (filterStage === 'in_preparation') return o.status === 'in_preparation'
    return true
  })

  const countConfirmed = orders.filter((o) => o.status === 'confirmed').length
  const countInPrep = orders.filter((o) => o.status === 'in_preparation').length

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Fila de Produção da Cozinha</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400">
                    KDS Forno
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualização otimizada para TV e monitores da área de forno e montagem.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stage filter buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterStage('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterStage === 'all'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Fila Total ({orders.length})
              </button>
              <button
                onClick={() => setFilterStage('confirmed')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterStage === 'confirmed'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aguardando ({countConfirmed})
              </button>
              <button
                onClick={() => setFilterStage('in_preparation')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterStage === 'in_preparation'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                No Forno ({countInPrep})
              </button>
            </div>

            {/* Fullscreen TV toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Alternar Modo Tela Cheia para Monitor da Cozinha"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">TV / Tela Cheia</span>
            </button>
          </div>
        </div>

        {/* Cozinha Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum pedido na fila da cozinha</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Todos os pedidos confirmados foram finalizados ou ainda não há novos pedidos aceitos. Novos pedidos confirmados entrarão aqui automaticamente.
            </p>
            <Link
              to="/unified-orders"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold rounded-xl border border-slate-700 transition-all"
            >
              <span>Ver Tela Unificada</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order, idx) => {
              const minutes = getMinutesElapsed(order.received_at)
              const isUrgent = minutes >= 25
              const isLate = minutes >= 40
              const isPrep = order.status === 'in_preparation'
              const isLoading = actionLoading === order.id

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                    isLate
                      ? 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500 ring-2 ring-rose-500/30'
                      : isPrep
                      ? 'bg-gradient-to-b from-amber-950/20 to-slate-900 border-amber-500/60 ring-1 ring-amber-500/30'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  {/* Comanda Header */}
                  <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-2">
                    <div className="flex items-center justify-between">
                      {/* Sequência de Chegada */}
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-sm font-bold text-white tracking-wider">
                          {order.external_order_id}
                        </span>
                      </div>

                      {/* Canal */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getChannelColor(order.channel_type)}`}>
                        {order.channel_type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {/* Status Stage */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          isPrep
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {isPrep ? <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{isPrep ? 'No Forno / Preparando' : 'Aguardando Forno'}</span>
                      </span>

                      {/* Tempo Decorrido */}
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                          isLate
                            ? 'bg-rose-500 text-white animate-pulse'
                            : isUrgent
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {minutes} min
                      </span>
                    </div>
                  </div>

                  {/* Comanda Body (Pizzas e Recheios com destaque em alta legibilidade) */}
                  <div className="p-4 space-y-4 flex-1">
                    {/* Alerta de Observações Críticas */}
                    {order.customer_notes && (
                      <div className="p-2.5 rounded-xl bg-amber-500/20 border-2 border-amber-500/40 text-amber-200 text-xs font-bold flex items-start gap-2 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="uppercase tracking-wide leading-tight">
                          ATENÇÃO: {order.customer_notes}
                        </span>
                      </div>
                    )}

                    {/* Itens para a Cozinha */}
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="border-b border-slate-800/80 pb-3 last:border-0 last:pb-0 space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white font-mono text-sm font-extrabold shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="text-sm font-bold text-white leading-snug">
                              {item.item_name}
                            </span>
                          </div>

                          {/* Bordas e Adicionais em Destaque */}
                          {item.selected_options.length > 0 && (
                            <div className="pl-8 space-y-0.5">
                              {item.selected_options.map((opt, i) => (
                                <div key={i} className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                                  <span>✦</span>
                                  <span>{opt.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.item_notes && (
                            <div className="pl-8 text-[11px] text-slate-400 italic">
                              Obs: {item.item_notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comanda Footer - Botão Marcar Pronto */}
                  <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
                    {isPrep ? (
                      <button
                        onClick={() => handleMarkReady(order.id)}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>✓ MARCAR PRONTO</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartPrep(order.id)}
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Iniciar Preparo no Forno</span>
                      </button>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Cliente: {order.customer?.name || 'Balcão'}</span>
                      <Link
                        to={`/order/${order.id}`}
                        className="text-orange-400 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Comanda</span>
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
