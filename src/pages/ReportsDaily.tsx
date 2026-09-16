import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { reportService, DailyReportData } from '@/services/reportService'
import {
  BarChart2,
  Sparkles,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertOctagon,
  RotateCcw,
  CheckCircle2,
  Clock,
  Pizza,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react'

export const ReportsDaily: React.FC = () => {
  const [report, setReport] = useState<DailyReportData>(reportService.getDailyReport())
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const unsub = reportService.subscribe(() => {
      setReport(reportService.getDailyReport())
    })
    return unsub
  }, [])

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setFeedback(null)
    try {
      await reportService.generateDailyReport(selectedDate)
      setFeedback('Relatório diário recalculado e analisado com sucesso pela IA!')
      setTimeout(() => setFeedback(null), 4000)
    } finally {
      setIsGenerating(false)
    }
  }

  const { metrics, ai_insights } = report
  const ownChannelsRevenue = (metrics.channels.whatsapp || 0) + (metrics.channels.own_site || 0)
  const ownChannelsPct = metrics.total_revenue > 0
    ? Math.round((ownChannelsRevenue / metrics.total_revenue) * 100)
    : 0

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Relatório Diário de Vendas & IA
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Fechamento com IA
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Consolidação de faturamento por canal, ticket médio, cancelamentos e diagnóstico automático do expediente
              </p>
            </div>
          </div>

          {/* Seletor de Data e Ações */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition transform active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Processando IA...' : 'Atualizar Relatório com IA'}</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Faturamento Total
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              R$ {metrics.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Receita consolidada de todos os canais
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pedidos Concluídos
            </p>
            <p className="text-2xl font-black text-white mt-1">{metrics.total_orders}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Volume total entregue no expediente
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ticket Médio
            </p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              R$ {metrics.average_ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Média por pedido fechado
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cancelamentos
            </p>
            <p className="text-2xl font-black text-red-400 mt-1">
              {metrics.canceled_orders} ({metrics.cancellation_rate}%)
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Taxa de tolerância abaixo de 3%
            </span>
          </div>
        </div>

        {/* Gráfico / Distribuição por Canal & Itens Mais Vendidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Faturamento por Canal */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Faturamento por Canal de Origem
                </h3>
                <p className="text-xs text-slate-400">
                  Canais próprios representaram <strong>{ownChannelsPct}%</strong> do total hoje
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                Margem Cheia sem Comissões: R$ {ownChannelsRevenue.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { name: 'iFood Delivery', value: metrics.channels.ifood, color: 'bg-red-500' },
                { name: 'WhatsApp (Canal Próprio)', value: metrics.channels.whatsapp, color: 'bg-emerald-500' },
                { name: '99Food', value: metrics.channels['99food'], color: 'bg-amber-500' },
                { name: 'Keeta Delivery', value: metrics.channels.keeta, color: 'bg-teal-500' },
                { name: 'Site Próprio (/loja)', value: metrics.channels.own_site, color: 'bg-purple-500' }
              ].map((channel) => {
                const pct = metrics.total_revenue > 0
                  ? Math.round((channel.value / metrics.total_revenue) * 100)
                  : 0

                return (
                  <div key={channel.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{channel.name}</span>
                      <span className="font-bold text-white">
                        R$ {channel.value.toFixed(2)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${channel.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ranking dos Itens Mais Vendidos */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Pizza className="w-4 h-4 text-amber-400" />
                <span>Mais Vendidos</span>
              </h3>
              <span className="text-xs text-slate-500">Unidades</span>
            </div>

            <div className="space-y-3">
              {metrics.top_items.map((item, idx) => (
                <div
                  key={item.name}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-amber-400 font-black text-xs flex items-center justify-center">
                      {idx + 1}º
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[160px]">
                      {item.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-bold text-xs">
                    {item.quantity} un
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card de Diagnóstico e Insights da IA */}
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">
                Diagnóstico Executivo com IA (Gemini / GPT)
              </h3>
            </div>
            <span className="text-xs text-purple-300 font-medium">
              Gerado automaticamente às{' '}
              {new Date(report.generated_at).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
            {ai_insights}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
