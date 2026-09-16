import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  orderService,
  Order,
  OrderStatus,
  ChannelType
} from '@/services/orderService'
import {
  FileText,
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Truck,
  Check,
  Building2,
  History,
  Send,
  ChefHat
} from 'lucide-react'

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const updateOrder = () => {
      if (!id) return
      const found = orderService.getOrderById(id)
      if (found) {
        setOrder(found)
      } else {
        // Se id for exemplo genérico, pega o primeiro pedido ativo
        const active = orderService.getActiveOrders()
        if (active.length > 0) {
          setOrder(active[0])
        }
      }
    }

    updateOrder()
    const unsubscribe = orderService.subscribe(() => {
      updateOrder()
    })
    return () => unsubscribe()
  }, [id])

  if (!order) {
    return (
      <AppLayout>
        <div className="p-12 text-center max-w-md mx-auto space-y-4">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">Pedido não encontrado</h2>
          <p className="text-xs text-slate-400">
            O pedido com identificador <code>{id}</code> não foi localizado ou já foi arquivado.
          </p>
          <Link
            to="/unified-orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Tela Unificada</span>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const handleConfirmOrder = async () => {
    setActionLoading(true)
    try {
      await orderService.confirmOrder(
        order.id,
        profile?.role || 'owner_manager',
        profile?.full_name || 'Atendente'
      )
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAdvanceStatus = async (toStatus: OrderStatus) => {
    setActionLoading(true)
    try {
      await orderService.advanceOrderStatus(
        order.id,
        toStatus,
        profile?.role || 'owner_manager',
        profile?.full_name || 'Atendente'
      )
      if (toStatus === 'delivered') {
        navigate('/unified-orders')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getChannelBadge = (type: ChannelType) => {
    switch (type) {
      case 'ifood':
        return { label: 'iFood', bg: 'bg-red-500/10 text-red-400 border-red-500/30' }
      case '99food':
        return { label: '99Food', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
      case 'keeta':
        return { label: 'Keeta', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' }
      case 'whatsapp':
        return { label: 'WhatsApp IA', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
      case 'own_site':
        return { label: 'Site Próprio', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' }
    }
  }

  const chBadge = getChannelBadge(order.channel_type)

  const steps: { key: OrderStatus; label: string }[] = [
    { key: 'new', label: 'Novo' },
    { key: 'confirmed', label: 'Confirmado' },
    { key: 'in_preparation', label: 'Em Preparo' },
    { key: 'ready', label: 'Pronto' },
    { key: 'out_for_delivery', label: 'Em Rota' },
    { key: 'delivered', label: 'Entregue' }
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === order.status)

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link to="/unified-orders" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar p/ Pedidos</span>
              </Link>
              <span>/</span>
              <span className="text-orange-400 font-medium">Comanda #{order.external_order_id}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-orange-500" />
                <span>Pedido #{order.external_order_id}</span>
              </h1>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${chBadge.bg}`}>
                {chBadge.label}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                {order.delivery_type === 'delivery' ? '🛵 Entrega' : '🥡 Retirada no Balcão'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir comanda de produção"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Imprimir Comanda</span>
            </button>
          </div>
        </div>

        {/* Status Stepper Progression */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Progresso Operacional do Pedido</span>
            <span className="text-orange-400">
              Status atual: <strong>{steps.find((s) => s.key === order.status)?.label || order.status}</strong>
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 text-center text-xs">
            {steps.map((st, i) => {
              const isPast = i <= currentStepIndex
              const isCurrent = i === currentStepIndex
              return (
                <div key={st.key} className="space-y-1.5">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 ring-2 ring-orange-500/40 animate-pulse'
                        : isPast
                        ? 'bg-orange-600'
                        : 'bg-slate-800'
                    }`}
                  />
                  <span
                    className={`block text-[11px] truncate ${
                      isCurrent
                        ? 'text-white font-bold'
                        : isPast
                        ? 'text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Contextual Action Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800/80">
            {order.status === 'new' && (
              <button
                onClick={handleConfirmOrder}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Aceitar e Confirmar Pedido</span>
              </button>
            )}

            {order.status === 'confirmed' && (
              <button
                onClick={() => handleAdvanceStatus('in_preparation')}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                <span>Iniciar Preparo na Cozinha</span>
              </button>
            )}

            {order.status === 'in_preparation' && (
              <button
                onClick={() => handleAdvanceStatus('ready')}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Marcar como Pronto</span>
              </button>
            )}

            {order.status === 'ready' && (
              <button
                onClick={() => handleAdvanceStatus('out_for_delivery')}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Despachar / Saiu p/ Entrega</span>
              </button>
            )}

            {order.status === 'out_for_delivery' && (
              <button
                onClick={() => handleAdvanceStatus('delivered')}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Concluir Entrega (Arquivar)</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center (2 cols): Items & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Itens do Pedido */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Itens da Comanda ({order.items.length})
              </h3>

              <div className="divide-y divide-slate-800">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-mono text-xs font-bold flex items-center justify-center">
                          {item.quantity}x
                        </span>
                        <span className="text-sm font-bold text-white">{item.item_name}</span>
                      </div>

                      {item.selected_options.length > 0 && (
                        <div className="pl-8 space-y-0.5">
                          {item.selected_options.map((opt, i) => (
                            <div key={i} className="text-xs text-orange-400 flex items-center gap-1.5">
                              <span>✦</span>
                              <span>{opt.name}</span>
                              {opt.price > 0 && (
                                <span className="text-slate-400 font-mono text-[11px]">
                                  (+R$ {opt.price.toFixed(2).replace('.', ',')})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {item.item_notes && (
                        <div className="pl-8 text-xs text-slate-400 italic">
                          Nota do item: {item.item_notes}
                        </div>
                      )}
                    </div>

                    <div className="text-right font-mono text-xs font-bold text-white shrink-0">
                      R$ {(item.quantity * item.unit_price).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Observações do Cliente */}
              {order.customer_notes && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Observações do Cliente para a Pizzaria:</span>
                  </div>
                  <p className="italic pl-5">{order.customer_notes}</p>
                </div>
              )}

              {/* Resumo Financeiro */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal dos Itens</span>
                  <span className="font-mono">R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxa de Entrega</span>
                  <span className="font-mono">{order.delivery_type === 'delivery' ? 'Inclusa' : 'Grátis'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Valor Total</span>
                  <span className="font-mono text-base text-orange-400">
                    R$ {order.total_amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* Histórico de Auditoria de Status (order_status_history) */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-400" />
                  <span>Histórico de Auditoria (order_status_history)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Trigger Imutável</span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {order.status_history.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative space-y-0.5">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-slate-900" />
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>Status: <strong className="text-orange-400">{hist.to_status}</strong></span>
                      {hist.from_status && (
                        <span className="text-slate-500 text-[11px]">(anterior: {hist.from_status})</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Por: {hist.changed_by_name || 'Sistema'}</span>
                      <span>•</span>
                      <span>{new Date(hist.created_at).toLocaleTimeString('pt-BR')}</span>
                      <span>•</span>
                      <span className="text-emerald-400">Sincronizado</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Customer, Address, PDV */}
          <div className="space-y-6">
            {/* Cliente & Contato */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400" />
                <span>Dados do Cliente</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Nome</span>
                  <span className="font-semibold text-white">{order.customer?.name || 'Não informado'}</span>
                </div>

                {order.customer?.phone && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Telefone / WhatsApp</span>
                    <a
                      href={`https://wa.me/55${order.customer.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-emerald-400 hover:underline flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{order.customer.phone}</span>
                    </a>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 block text-[11px]">Pagamento</span>
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.payment_method}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço de Entrega */}
            {order.delivery_type === 'delivery' && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span>Endereço de Entrega</span>
                </h3>

                <div className="space-y-1 text-xs text-slate-300">
                  <p className="font-semibold text-white">
                    {order.delivery_address.street}, {order.delivery_address.number}
                  </p>
                  {order.delivery_address.complement && (
                    <p className="text-slate-400">{order.delivery_address.complement}</p>
                  )}
                  <p className="text-slate-400">{order.delivery_address.neighborhood}</p>
                  <p className="text-slate-400">{order.delivery_address.city}</p>
                </div>
              </div>
            )}

            {/* Status PDV */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-400" />
                <span>Integração com PDV</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {order.pdv_synced_at ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sincronizado c/ PDV</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>Aguardando Aceite</span>
                    </div>
                  )}
                </div>

                {order.pdv_synced_at && (
                  <p className="text-[11px] text-slate-500 font-mono">
                    Emitido em: {new Date(order.pdv_synced_at).toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
