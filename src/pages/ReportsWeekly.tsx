import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { reportService, WeeklyReportData } from '@/services/reportService'
import {
  TrendingUp,
  Sparkles,
  DollarSign,
  ShoppingBag,
  Calendar,
  Clock,
  Star,
  Boxes,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-react'

export const ReportsWeekly: React.FC = () => {
  const [report, setReport] = useState<WeeklyReportData>(reportService.getWeeklyReport())
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const unsub = reportService.subscribe(() => {
      setReport(reportService.getWeeklyReport())
    })
    return unsub
  }, [])

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setFeedback(null)
    try {
      await reportService.generateWeeklyReport()
      setFeedback('Relatório semanal consolidado e analisado com sucesso pela IA!')
      setTimeout(() => setFeedback(null), 4000)
    } finally {
      setIsGenerating(false)
    }
  }

  const { metrics, ai_insights } = report
  const maxDailyRevenue = Math.max(...metrics.daily_evolution.map((d) => d.revenue), 1)

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Relatório Semanal Estratégico & IA
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Visão Executiva (7 Dias)
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Período de {report.period_start} a {report.period_end} • Curva de demanda, horários de pico e plano tático
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition transform active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Analisando Semana...' : 'Atualizar Relatório Semanal com IA'}</span>
          </button>
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
              Faturamento Semanal
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">
                R$ {metrics.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                +{metrics.growth_pct}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Comparativo vs 7 dias anteriores
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Volume de Pedidos
            </p>
            <p className="text-2xl font-black text-white mt-1">{metrics.total_orders}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Média de {Math.round(metrics.total_orders / 7)} pedidos/dia
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ticket Médio da Semana
            </p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              R$ {metrics.average_ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Estabilidade com alto índice de adicionais
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pico de Atendimento
            </p>
            <p className="text-xl font-bold text-purple-300 mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              {metrics.peak_hours}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 block">
              62% do faturamento concentrado no horário
            </span>
          </div>
        </div>

        {/* Evolução Diária (Segunda a Domingo) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Evolução Diária de Faturamento & Pedidos
              </h3>
              <p className="text-xs text-slate-400">
                Pico concentrado em <strong>{metrics.peak_days.join(', ')}</strong> • Oportunidade em <strong>{metrics.slow_days.join(' e ')}</strong>
              </p>
            </div>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Sábado foi o dia mais lucrativo (R$ 6.200,00)
            </span>
          </div>

          {/* Gráfico de Barras Relativo */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-52 pt-6">
            {metrics.daily_evolution.map((day) => {
              const heightPct = Math.round((day.revenue / maxDailyRevenue) * 100)
              const isPeak = day.revenue >= 4500

              return (
                <div key={day.day} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-300">
                    R$ {Math.round(day.revenue)}
                  </span>
                  <div className="w-full max-w-[48px] bg-slate-800/80 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-700 ${
                        isPeak
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-gradient-to-t from-purple-800 to-indigo-600'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-white block">{day.day}</span>
                    <span className="text-[10px] text-slate-500">{day.orders} ped</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Indicadores Operacionais & Canais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Divisão Semanal por Canal */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Divisão de Faturamento por Canal (Últimos 7 Dias)
            </h3>
            <div className="space-y-3">
              {[
                { name: 'iFood Marketplace', value: metrics.channels.ifood, color: 'bg-red-500' },
                { name: 'WhatsApp (IA + Atendente)', value: metrics.channels.whatsapp, color: 'bg-emerald-500' },
                { name: '99Food', value: metrics.channels['99food'], color: 'bg-amber-500' },
                { name: 'Keeta Delivery', value: metrics.channels.keeta, color: 'bg-teal-500' },
                { name: 'Site Próprio (/loja)', value: metrics.channels.own_site, color: 'bg-purple-500' }
              ].map((c) => {
                const pct = Math.round((c.value / metrics.total_revenue) * 100)
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{c.name}</span>
                      <span className="font-bold text-white">
                        R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${c.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Qualidade e Alertas */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Saúde Operacional
            </h3>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Satisfação em Avaliações</span>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-bold text-white">{metrics.reviews.avg_rating}★</span>
                  <span className="text-xs text-emerald-400 font-semibold ml-auto">
                    {metrics.reviews.positive_pct}% Positivas
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Alertas de Estoque Prevenidos</span>
                <div className="flex items-center gap-2 mt-1">
                  <Boxes className="w-4 h-4 text-purple-400" />
                  <span className="text-lg font-bold text-white">
                    {metrics.inventory_alerts_count} disparados
                  </span>
                  <span className="text-xs text-purple-300 font-medium ml-auto">
                    Zero ruptura
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              Dados consolidados automaticamente pelos módulos de IA do PizzaHub.
            </div>
          </div>
        </div>

        {/* Card Estratégico da IA */}
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/30 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">
                Parecer Estratégico Semanal da IA (Gemini / GPT)
              </h3>
            </div>
            <span className="text-xs text-purple-300 font-medium">
              Análise Multidimensional dos 7 Dias
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
