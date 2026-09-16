import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  inventoryService,
  InventoryItem,
  InventoryAlert
} from '@/services/inventoryService'
import {
  Boxes,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Plus,
  Search,
  RotateCcw,
  TrendingDown,
  Clock,
  Trash2,
  Edit2,
  X,
  Check,
  Scale,
  Calendar,
  Layers,
  Info
} from 'lucide-react'

export const Inventory: React.FC = () => {
  const { profile } = useAuth()
  const isManager = profile?.role === 'owner_manager'

  const [items, setItems] = useState<InventoryItem[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all')

  const [isForecasting, setIsForecasting] = useState(false)
  const [forecastFeedback, setForecastFeedback] = useState<string | null>(null)

  // Modal de cadastro/edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg' as 'kg' | 'un' | 'l',
    current_quantity: '',
    min_threshold: ''
  })

  const loadData = () => {
    setItems(inventoryService.getItems())
    setAlerts(inventoryService.getAlerts(true)) // somente não resolvidos
  }

  useEffect(() => {
    loadData()
    const unsubscribe = inventoryService.subscribe(() => {
      loadData()
    })
    return unsubscribe
  }, [])

  // Métricas
  const totalItems = items.length
  const criticalItems = items.filter((i) => i.current_quantity <= i.min_threshold)
  const warningItems = items.filter(
    (i) => i.current_quantity > i.min_threshold && i.current_quantity <= i.min_threshold * 1.3
  )
  const activeAlertsCount = alerts.length

  // Filtragem da lista
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    if (statusFilter === 'critical') return item.current_quantity <= item.min_threshold
    if (statusFilter === 'warning')
      return item.current_quantity > item.min_threshold && item.current_quantity <= item.min_threshold * 1.3
    if (statusFilter === 'ok') return item.current_quantity > item.min_threshold * 1.3
    return true
  })

  // Disparar previsão da IA
  const handleRunForecast = async () => {
    setIsForecasting(true)
    setForecastFeedback(null)
    try {
      const result = await inventoryService.runForecast(24)
      loadData()
      setForecastFeedback(
        `Previsão concluída! ${result.alertsCreated} novo(s) alerta(s) de esgotamento gerado(s) com base no ritmo de pedidos.`
      )
      setTimeout(() => setForecastFeedback(null), 5000)
    } finally {
      setIsForecasting(false)
    }
  }

  // Resolver alerta
  const handleResolveAlert = async (alertId: string) => {
    await inventoryService.resolveAlert(alertId)
  }

  // Ajuste rápido de quantidade (+ ou -)
  const handleQuickAdjust = async (id: string, delta: number) => {
    await inventoryService.updateQuantity(id, { delta })
  }

  // Excluir insumo
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o insumo "${name}"?`)) {
      await inventoryService.deleteItem(id)
    }
  }

  // Abrir modal de criação
  const handleOpenCreateModal = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      unit: 'kg',
      current_quantity: '',
      min_threshold: ''
    })
    setIsModalOpen(true)
  }

  // Abrir modal de edição
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      unit: item.unit,
      current_quantity: String(item.current_quantity),
      min_threshold: String(item.min_threshold)
    })
    setIsModalOpen(true)
  }

  // Salvar formulário
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const current_quantity = Number(formData.current_quantity) || 0
    const min_threshold = Number(formData.min_threshold) || 0

    if (editingItem) {
      await inventoryService.updateItem(editingItem.id, {
        name: formData.name.trim(),
        unit: formData.unit,
        current_quantity,
        min_threshold
      })
    } else {
      await inventoryService.addItem({
        pizzeria_id: profile?.pizzeria_id || 'piz-123',
        name: formData.name.trim(),
        unit: formData.unit,
        current_quantity,
        min_threshold
      })
    }

    setIsModalOpen(false)
  }

  const formatHoursRemaining = (isoDate: string) => {
    try {
      const target = new Date(isoDate).getTime()
      const now = Date.now()
      const diffHours = Math.max(0, (target - now) / (3600 * 1000))

      if (diffHours < 1) return 'Menos de 1 hora'
      if (diffHours < 24) return `Em aprox. ${Math.round(diffHours)} horas`
      const days = Math.floor(diffHours / 24)
      return `Em aprox. ${days} dia(s)`
    } catch {
      return ''
    }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Controle de Estoque & Previsão da IA
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Previsão Ativa
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Estimativa inteligente de consumo baseada nos pedidos e emissão de alertas preventivos (RS-16)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunForecast}
              disabled={isForecasting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition transform active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${isForecasting ? 'animate-spin' : ''}`} />
              <span>{isForecasting ? 'Calculando Previsão...' : 'Disparar Previsão da IA'}</span>
            </button>

            {isManager && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Insumo</span>
              </button>
            )}

            <button
              onClick={() => {
                inventoryService.resetToDefault()
                loadData()
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Resetar dados para padrão de demonstração"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback de Previsão */}
        {forecastFeedback && (
          <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between shadow-lg shadow-purple-950/50 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{forecastFeedback}</span>
            </div>
            <button onClick={() => setForecastFeedback(null)} className="text-purple-400 hover:text-purple-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Insumos Monitorados</p>
              <p className="text-2xl font-bold text-white mt-1">{totalItems}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
              <Boxes className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Abaixo do Mínimo</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{criticalItems.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Próximos do Limite</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{warningItems.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas IA Pendentes</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{activeAlertsCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ================= SEÇÃO DE ALERTAS PREVENTIVOS DA IA ================= */}
        {alerts.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Alertas Preventivos da IA (Lead time: 24h)
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Insumos que correm risco de esgotamento antes da próxima reposição
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {alerts.map((alert) => {
                const item = alert.item
                const isCritical = alert.severity === 'critical'

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition ${
                      isCritical
                        ? 'bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border-red-500/50 shadow-md shadow-red-950/20'
                        : 'bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border-amber-500/40 shadow-md shadow-amber-950/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCritical
                              ? 'bg-red-500 text-slate-950 animate-pulse'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {isCritical ? 'Crítico' : 'Atenção'}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {item?.name || 'Insumo'}
                        </h3>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-3 pt-1">
                        <span>
                          Atual: <strong>{item?.current_quantity} {item?.unit}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Mínimo: <strong>{item?.min_threshold} {item?.unit}</strong>
                        </span>
                      </div>

                      <div className="text-xs text-amber-400 flex items-center gap-1.5 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Previsão de esgotamento: <strong>{formatHoursRemaining(alert.predicted_depletion_at)}</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition shrink-0 self-center"
                      title="Marcar alerta como resolvido"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resolver</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================= TABELA DE INSUMOS ================= */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Barra de Filtros */}
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar insumo (ex: Mussarela)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({items.length})
              </button>
              <button
                onClick={() => setStatusFilter('critical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === 'critical'
                    ? 'bg-red-950/80 text-red-300 border border-red-500/40 shadow-sm'
                    : 'text-red-400 hover:text-red-300'
                }`}
              >
                Críticos ({criticalItems.length})
              </button>
              <button
                onClick={() => setStatusFilter('warning')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === 'warning'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                Em Atenção ({warningItems.length})
              </button>
              <button
                onClick={() => setStatusFilter('ok')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === 'ok'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Normais
              </button>
            </div>
          </div>

          {/* Tabela Responsiva */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Insumo</th>
                  <th className="px-5 py-3.5">Estoque Atual</th>
                  <th className="px-5 py-3.5">Mínimo</th>
                  <th className="px-5 py-3.5">Nível de Saúde</th>
                  <th className="px-5 py-3.5 text-center">Ajuste Rápido</th>
                  {isManager && <th className="px-5 py-3.5 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum insumo encontrado com os filtros selecionados.</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const ratio = item.min_threshold > 0 ? (item.current_quantity / item.min_threshold) * 100 : 100
                    const isCrit = item.current_quantity <= item.min_threshold
                    const isWarn = !isCrit && item.current_quantity <= item.min_threshold * 1.3

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3.5 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {isCrit && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                Repor!
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`font-bold text-sm ${
                              isCrit ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {item.current_quantity}
                          </span>{' '}
                          <span className="text-slate-500 text-xs">{item.unit}</span>
                        </td>

                        <td className="px-5 py-3.5 text-slate-400">
                          {item.min_threshold} {item.unit}
                        </td>

                        {/* Barra de Saúde */}
                        <td className="px-5 py-3.5">
                          <div className="w-36 space-y-1">
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isCrit
                                    ? 'bg-red-500'
                                    : isWarn
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, ratio)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {Math.round(ratio)}% do mínimo
                            </span>
                          </div>
                        </td>

                        {/* Ajuste Rápido */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button
                              onClick={() => handleQuickAdjust(item.id, item.unit === 'un' ? -5 : -1)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                              title={`Diminuir ${item.unit === 'un' ? 5 : 1} ${item.unit}`}
                            >
                              -{item.unit === 'un' ? 5 : 1}
                            </button>
                            <button
                              onClick={() => handleQuickAdjust(item.id, item.unit === 'un' ? 5 : 1)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                              title={`Adicionar ${item.unit === 'un' ? 5 : 1} ${item.unit}`}
                            >
                              +{item.unit === 'un' ? 5 : 1}
                            </button>
                          </div>
                        </td>

                        {/* Ações */}
                        {isManager && (
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Editar insumo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.name)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-300 transition"
                                title="Excluir insumo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Cadastro / Edição */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Editar Insumo' : 'Cadastrar Novo Insumo'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome do Insumo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Queijo Gorgonzola, Molho Pelati..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Unidade
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    >
                      <option value="kg">kg (quilos)</option>
                      <option value="un">un (unidades)</option>
                      <option value="l">l (litros)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Qtd. Atual
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={formData.current_quantity}
                      onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={formData.min_threshold}
                      onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Cadastrar Insumo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
