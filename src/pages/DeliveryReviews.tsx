import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import {
  reviewService,
  DeliveryReview,
  ReviewMetrics
} from '@/services/reviewService'
import {
  Star,
  Sparkles,
  Smile,
  Meh,
  Frown,
  MessageSquare,
  Filter,
  Search,
  Plus,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  CheckCircle2,
  X,
  Send,
  SlidersHorizontal,
  Flame
} from 'lucide-react'

export const DeliveryReviews: React.FC = () => {
  const [reviews, setReviews] = useState<DeliveryReview[]>([])
  const [metrics, setMetrics] = useState<ReviewMetrics>({
    totalCount: 0,
    avgRating: 0,
    sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
    sentimentPercentages: { positive: 0, neutral: 0, negative: 0 },
    topTopics: [],
    channelStats: {}
  })

  // Filtros
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Estado de processamento de IA
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisFeedback, setAnalysisFeedback] = useState<string | null>(null)

  // Modal de Simulação
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newReview, setNewReview] = useState({
    channel_name: 'iFood' as 'iFood' | '99Food' | 'Keeta' | 'Site Próprio',
    rating: 5,
    comment: ''
  })

  const loadData = () => {
    setReviews(reviewService.getReviews())
    setMetrics(reviewService.getMetrics())
  }

  useEffect(() => {
    loadData()
    const unsubscribe = reviewService.subscribe(() => {
      loadData()
    })
    return unsubscribe
  }, [])

  // Filtragem
  const filteredReviews = reviews.filter((r) => {
    if (channelFilter !== 'all' && r.channel_name !== channelFilter) return false
    if (sentimentFilter !== 'all' && r.ai_sentiment !== sentimentFilter) return false
    if (selectedTopic && (!r.ai_topics || !r.ai_topics.includes(selectedTopic))) return false

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const matchComment = r.comment.toLowerCase().includes(term)
      const matchTopics = r.ai_topics?.some((t) => t.toLowerCase().includes(term))
      if (!matchComment && !matchTopics) return false
    }

    return true
  })

  // Executar análise com IA
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisFeedback(null)
    try {
      const analyzed = await reviewService.runAiAnalysis()
      loadData()
      setAnalysisFeedback(
        `Análise concluída! ${analyzed} avaliação(ões) pendente(s) processada(s) pelo modelo de IA com sentimento e tópicos atualizados.`
      )
      setTimeout(() => setAnalysisFeedback(null), 5000)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Submeter nova avaliação simulada
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReview.comment.trim()) return

    await reviewService.addReview({
      pizzeria_id: 'piz-123',
      channel_id: 'chan-' + newReview.channel_name.toLowerCase().replace(/\s+/g, ''),
      channel_name: newReview.channel_name,
      rating: Number(newReview.rating),
      comment: newReview.comment.trim(),
      ai_topics: []
    })

    setNewReview({
      channel_name: 'iFood',
      rating: 5,
      comment: ''
    })
    setIsModalOpen(false)
  }

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime()
      const diffHours = Math.floor(diffMs / (3600 * 1000))
      if (diffHours < 1) return 'Há poucos minutos'
      if (diffHours < 24) return `Há ${diffHours} hora(s)`
      const diffDays = Math.floor(diffHours / 24)
      return `Há ${diffDays} dia(s)`
    } catch {
      return ''
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'iFood':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case '99Food':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'Keeta':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'Site Próprio':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Star className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Avaliações dos Canais de Delivery
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Gemini / GPT Long-Context
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Consolidação unificada de notas, análise de sentimentos e mineração de tópicos recorrentes (RS-18)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition transform active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analisando Avaliações...' : 'Executar Análise de IA'}</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Simular Avaliação</span>
            </button>

            <button
              onClick={() => {
                reviewService.resetToDefault()
                loadData()
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Resetar avaliações para demonstração"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback de Análise */}
        {analysisFeedback && (
          <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between shadow-lg shadow-purple-950/50 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{analysisFeedback}</span>
            </div>
            <button onClick={() => setAnalysisFeedback(null)} className="text-purple-400 hover:text-purple-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cards de KPIs e Sentimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Média de Estrelas */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Média Geral de Avaliações
              </span>
              <div className="flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(metrics.avgRating) ? 'fill-amber-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {metrics.avgRating}
              </span>
              <span className="text-slate-500 font-semibold text-sm">/ 5.0</span>
              <span className="ml-auto text-xs text-slate-400">
                Baseado em <strong>{metrics.totalCount}</strong> avaliações
              </span>
            </div>

            {/* Média por canal */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              {Object.entries(metrics.channelStats).map(([ch, stat]) => (
                <div key={ch} className="text-center">
                  <span className="text-[10px] text-slate-500 block">{ch}</span>
                  <span className="font-bold text-white">{stat.avgRating}★</span>
                </div>
              ))}
            </div>
          </div>

          {/* Distribuição de Sentimento */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Análise de Sentimentos da IA
            </span>

            {/* Barra Tri-colorida */}
            <div className="my-3 space-y-2">
              <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${metrics.sentimentPercentages.positive}%` }}
                  title={`Positivas: ${metrics.sentimentPercentages.positive}%`}
                />
                <div
                  className="bg-slate-500 transition-all duration-500"
                  style={{ width: `${metrics.sentimentPercentages.neutral}%` }}
                  title={`Neutras: ${metrics.sentimentPercentages.neutral}%`}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${metrics.sentimentPercentages.negative}%` }}
                  title={`Negativas: ${metrics.sentimentPercentages.negative}%`}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Smile className="w-4 h-4" />
                  <span>Positivas ({metrics.sentimentPercentages.positive}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Meh className="w-4 h-4" />
                  <span>Neutras ({metrics.sentimentPercentages.neutral}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-400">
                  <Frown className="w-4 h-4" />
                  <span>Negativas ({metrics.sentimentPercentages.negative}%)</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              Classificado automaticamente com base no teor do texto e estrelas atribuídas.
            </div>
          </div>

          {/* Tópicos em Destaque */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tópicos Mais Citados
              </span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>

            <div className="my-2 flex flex-wrap gap-1.5">
              {metrics.topTopics.slice(0, 6).map((item) => {
                const isSelected = selectedTopic === item.topic
                return (
                  <button
                    key={item.topic}
                    onClick={() => setSelectedTopic(isSelected ? null : item.topic)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : item.sentiment === 'positive'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : item.sentiment === 'negative'
                        ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span>#{item.topic}</span>
                    <span className="text-[10px] opacity-70">({item.count})</span>
                  </button>
                )
              })}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Clique em um tópico para filtrar</span>
              {selectedTopic && (
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= BARRA DE FILTROS ================= */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          {/* Busca Textual */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar comentário ou tópico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filtro por Canal */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['all', 'iFood', '99Food', 'Keeta', 'Site Próprio'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    channelFilter === ch
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ch === 'all' ? 'Todos Canais' : ch}
                </button>
              ))}
            </div>

            {/* Filtro por Sentimento */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSentimentFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  sentimentFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSentimentFilter('positive')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  sentimentFilter === 'positive'
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/40'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Positivos</span>
              </button>
              <button
                onClick={() => setSentimentFilter('negative')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  sentimentFilter === 'negative'
                    ? 'bg-red-950 text-red-200 border border-red-500/40'
                    : 'text-red-400 hover:text-red-300'
                }`}
              >
                <Frown className="w-3.5 h-3.5" />
                <span>Negativos</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= FEED DE AVALIAÇÕES ================= */}
        <div className="space-y-3.5">
          {filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Nenhuma avaliação encontrada</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Tente ajustar os filtros de canal, sentimento ou busca.
              </p>
            </div>
          ) : (
            filteredReviews.map((rev) => {
              const isPositive = rev.ai_sentiment === 'positive'
              const isNegative = rev.ai_sentiment === 'negative'

              return (
                <div
                  key={rev.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700/80 transition space-y-3"
                >
                  {/* Topo do Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getChannelColor(
                          rev.channel_name
                        )}`}
                      >
                        {rev.channel_name}
                      </span>

                      <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= Math.round(rev.rating) ? 'fill-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-white ml-1">{rev.rating}</span>
                      </div>

                      <span className="text-xs text-slate-500">
                        {formatRelativeTime(rev.reviewed_at)}
                      </span>
                    </div>

                    {/* Badge de Sentimento da IA */}
                    <div>
                      {isPositive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                          <Smile className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Sentimento Positivo</span>
                        </span>
                      ) : isNegative ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-semibold">
                          <Frown className="w-3.5 h-3.5 text-red-400" />
                          <span>Sentimento Negativo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                          <Meh className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sentimento Neutro</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comentário do Cliente */}
                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    "{rev.comment}"
                  </p>

                  {/* Tópicos Detectados pela IA */}
                  {rev.ai_topics && rev.ai_topics.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        Tópicos Identificados:
                      </span>
                      {rev.ai_topics.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700 text-[11px] font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Modal de Simulação de Nova Avaliação */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h3 className="text-base font-bold text-white">Simular Nova Avaliação</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Canal de Origem
                    </label>
                    <select
                      value={newReview.channel_name}
                      onChange={(e) =>
                        setNewReview({ ...newReview, channel_name: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    >
                      <option value="iFood">iFood</option>
                      <option value="99Food">99Food</option>
                      <option value="Keeta">Keeta</option>
                      <option value="Site Próprio">Site Próprio</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nota (1 a 5 estrelas)
                    </label>
                    <select
                      value={newReview.rating}
                      onChange={(e) =>
                        setNewReview({ ...newReview, rating: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                    >
                      <option value={5}>5 Estrelas (Excelente)</option>
                      <option value={4}>4 Estrelas (Muito bom)</option>
                      <option value={3}>3 Estrelas (Regular)</option>
                      <option value={2}>2 Estrelas (Ruim)</option>
                      <option value={1}>1 Estrela (Péssimo)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Comentário do Cliente
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Ex: A pizza chegou antes do prazo e muito quente, a borda recheada é espetacular..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    A IA irá analisar o sentimento e extrair automaticamente os tópicos citados.
                  </p>
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publicar & Analisar com IA</span>
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
