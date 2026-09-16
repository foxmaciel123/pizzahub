import { supabase } from '@/lib/supabase'

export interface DeliveryReview {
  id: string
  pizzeria_id: string
  channel_id: string
  channel_name: 'iFood' | '99Food' | 'Keeta' | 'Site Próprio'
  external_review_id?: string
  rating: number
  comment: string
  ai_sentiment?: 'positive' | 'neutral' | 'negative'
  ai_topics: string[]
  reviewed_at: string
}

export interface ReviewMetrics {
  totalCount: number
  avgRating: number
  sentimentCounts: {
    positive: number
    neutral: number
    negative: number
  }
  sentimentPercentages: {
    positive: number
    neutral: number
    negative: number
  }
  topTopics: { topic: string; count: number; sentiment: 'positive' | 'neutral' | 'negative' }[]
  channelStats: Record<string, { count: number; avgRating: number }>
}

const initialReviews: DeliveryReview[] = [
  {
    id: 'rev-01',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-ifood',
    channel_name: 'iFood',
    rating: 5.0,
    comment: 'Pizza chegou quentinha, massa bem fina e crocante. A borda vulcão de catupiry é surreal de boa!',
    ai_sentiment: 'positive',
    ai_topics: ['temperatura', 'qualidade da massa', 'borda recheada', 'sabor'],
    reviewed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'rev-02',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-ifood',
    channel_name: 'iFood',
    rating: 4.5,
    comment: 'Entrega super rápida em 26 minutos, motoboy muito educado. Apenas achei um pouco generosa demais na cebola.',
    ai_sentiment: 'positive',
    ai_topics: ['tempo de entrega', 'atendimento'],
    reviewed_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'rev-03',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-99',
    channel_name: '99Food',
    rating: 2.0,
    comment: 'Demorou mais de 55 minutos para entregar e a pizza chegou fria. A embalagem veio um pouco amassada na lateral.',
    ai_sentiment: 'negative',
    ai_topics: ['tempo de entrega', 'temperatura', 'embalagem'],
    reviewed_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
  },
  {
    id: 'rev-04',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-keeta',
    channel_name: 'Keeta',
    rating: 5.0,
    comment: 'Primeira vez pedindo pelo app Keeta e a experiência foi incrível! Pizza maravilhosa e excelente custo-benefício.',
    ai_sentiment: 'positive',
    ai_topics: ['sabor', 'custo-benefício'],
    reviewed_at: new Date(Date.now() - 16 * 3600 * 1000).toISOString()
  },
  {
    id: 'rev-05',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-site',
    channel_name: 'Site Próprio',
    rating: 5.0,
    comment: 'Atendimento pelo WhatsApp com a IA foi instantâneo e prático. A pizza de Calabresa artesanal chegou fumegando!',
    ai_sentiment: 'positive',
    ai_topics: ['atendimento', 'temperatura', 'sabor'],
    reviewed_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'rev-06',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-ifood',
    channel_name: 'iFood',
    rating: 3.0,
    comment: 'O sabor da massa é muito bom, mas esqueceram o refrigerante que pedi. O suporte me atendeu e estornou.',
    ai_sentiment: 'neutral',
    ai_topics: ['qualidade da massa', 'atendimento', 'experiência geral'],
    reviewed_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString()
  },
  {
    id: 'rev-07',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-99',
    channel_name: '99Food',
    rating: 1.5,
    comment: 'Infelizmente a massa veio queimada na parte de baixo, dando gosto amargo. Não consegui comer tudo.',
    ai_sentiment: 'negative',
    ai_topics: ['qualidade da massa', 'sabor'],
    reviewed_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
  },
  {
    id: 'rev-08',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-keeta',
    channel_name: 'Keeta',
    rating: 4.5,
    comment: 'Muito boa a pizza! Borda recheada com muito catupiry de verdade. Chegou dentro do tempo previsto.',
    ai_sentiment: 'positive',
    ai_topics: ['borda recheada', 'tempo de entrega', 'sabor'],
    reviewed_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  }
]

class ReviewStore {
  private reviews: DeliveryReview[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    const saved = localStorage.getItem('pizzahub_delivery_reviews')
    if (saved) {
      try {
        this.reviews = JSON.parse(saved)
      } catch {
        this.reviews = initialReviews
      }
    } else {
      this.reviews = initialReviews
      this.save()
    }
  }

  private save() {
    localStorage.setItem('pizzahub_delivery_reviews', JSON.stringify(this.reviews))
    this.notify()
  }

  private notify() {
    this.listeners.forEach((fn) => fn())
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  public getReviews(): DeliveryReview[] {
    return [...this.reviews].sort(
      (a, b) => new Date(b.reviewed_at).getTime() - new Date(a.reviewed_at).getTime()
    )
  }

  public getMetrics(): ReviewMetrics {
    const totalCount = this.reviews.length
    if (totalCount === 0) {
      return {
        totalCount: 0,
        avgRating: 0,
        sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
        sentimentPercentages: { positive: 0, neutral: 0, negative: 0 },
        topTopics: [],
        channelStats: {}
      }
    }

    let ratingSum = 0
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
    const topicFrequency: Record<string, { count: number; sentimentCount: Record<string, number> }> = {}
    const channelStats: Record<string, { count: number; ratingSum: number; avgRating: number }> = {}

    for (const r of this.reviews) {
      ratingSum += r.rating

      if (r.ai_sentiment === 'positive') sentimentCounts.positive++
      else if (r.ai_sentiment === 'negative') sentimentCounts.negative++
      else sentimentCounts.neutral++

      // Canal
      if (!channelStats[r.channel_name]) {
        channelStats[r.channel_name] = { count: 0, ratingSum: 0, avgRating: 0 }
      }
      channelStats[r.channel_name].count++
      channelStats[r.channel_name].ratingSum += r.rating

      // Tópicos
      if (Array.isArray(r.ai_topics)) {
        for (const t of r.ai_topics) {
          if (!topicFrequency[t]) {
            topicFrequency[t] = { count: 0, sentimentCount: { positive: 0, neutral: 0, negative: 0 } }
          }
          topicFrequency[t].count++
          if (r.ai_sentiment) {
            topicFrequency[t].sentimentCount[r.ai_sentiment] = (topicFrequency[t].sentimentCount[r.ai_sentiment] || 0) + 1
          }
        }
      }
    }

    const avgRating = Number((ratingSum / totalCount).toFixed(1))

    const sentimentPercentages = {
      positive: Math.round((sentimentCounts.positive / totalCount) * 100),
      neutral: Math.round((sentimentCounts.neutral / totalCount) * 100),
      negative: Math.round((sentimentCounts.negative / totalCount) * 100)
    }

    // Calcula avg por canal
    const formattedChannelStats: Record<string, { count: number; avgRating: number }> = {}
    for (const ch in channelStats) {
      formattedChannelStats[ch] = {
        count: channelStats[ch].count,
        avgRating: Number((channelStats[ch].ratingSum / channelStats[ch].count).toFixed(1))
      }
    }

    // Top tópicos ordenados por frequência
    const topTopics = Object.entries(topicFrequency)
      .map(([topic, data]) => {
        let domSentiment: 'positive' | 'neutral' | 'negative' = 'positive'
        if (data.sentimentCount.negative > data.sentimentCount.positive) {
          domSentiment = 'negative'
        } else if (data.sentimentCount.neutral > data.sentimentCount.positive && data.sentimentCount.neutral > data.sentimentCount.negative) {
          domSentiment = 'neutral'
        }
        return {
          topic,
          count: data.count,
          sentiment: domSentiment
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return {
      totalCount,
      avgRating,
      sentimentCounts,
      sentimentPercentages,
      topTopics,
      channelStats: formattedChannelStats
    }
  }

  public async addReview(
    review: Omit<DeliveryReview, 'id' | 'reviewed_at'>
  ): Promise<DeliveryReview> {
    const newRev: DeliveryReview = {
      ...review,
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      reviewed_at: new Date().toISOString()
    }

    // Se ainda não tiver sentimento/tópicos, executa a análise local
    if (!newRev.ai_sentiment || !newRev.ai_topics || newRev.ai_topics.length === 0) {
      const analyzed = this.analyzeLocally(newRev.comment, newRev.rating)
      newRev.ai_sentiment = analyzed.sentiment
      newRev.ai_topics = analyzed.topics
    }

    this.reviews.unshift(newRev)

    try {
      await supabase.from('delivery_reviews').insert({
        id: newRev.id,
        pizzeria_id: newRev.pizzeria_id,
        channel_id: newRev.channel_id,
        rating: newRev.rating,
        comment: newRev.comment,
        ai_sentiment: newRev.ai_sentiment,
        ai_topics: newRev.ai_topics,
        reviewed_at: newRev.reviewed_at
      })
    } catch {}

    this.save()
    return newRev
  }

  // Executa análise de IA nas avaliações pendentes
  public async runAiAnalysis(): Promise<number> {
    let count = 0
    for (const r of this.reviews) {
      if (!r.ai_sentiment || !r.ai_topics || r.ai_topics.length === 0) {
        const analyzed = this.analyzeLocally(r.comment, r.rating)
        r.ai_sentiment = analyzed.sentiment
        r.ai_topics = analyzed.topics
        count++
      }
    }
    this.save()
    return count
  }

  private analyzeLocally(comment: string, rating: number): { sentiment: 'positive' | 'neutral' | 'negative'; topics: string[] } {
    const text = (comment || '').toLowerCase()
    const detected: string[] = []

    if (text.includes('entrega') || text.includes('demor') || text.includes('rápido') || text.includes('tempo')) {
      detected.push('tempo de entrega')
    }
    if (text.includes('quente') || text.includes('fria') || text.includes('temperatura') || text.includes('fumegando')) {
      detected.push('temperatura')
    }
    if (text.includes('borda') || text.includes('catupiry') || text.includes('cheddar') || text.includes('recheada')) {
      detected.push('borda recheada')
    }
    if (text.includes('massa') || text.includes('fina') || text.includes('crocante') || text.includes('queimada')) {
      detected.push('qualidade da massa')
    }
    if (text.includes('sabor') || text.includes('delícia') || text.includes('gostosa') || text.includes('maravilhosa') || text.includes('salgada')) {
      detected.push('sabor')
    }
    if (text.includes('embalagem') || text.includes('caixa') || text.includes('amassada')) {
      detected.push('embalagem')
    }
    if (text.includes('atendimento') || text.includes('motoboy') || text.includes('educado') || text.includes('whatsapp')) {
      detected.push('atendimento')
    }
    if (text.includes('custo') || text.includes('preço') || text.includes('benefício') || text.includes('barato')) {
      detected.push('custo-benefício')
    }
    if (detected.length === 0) {
      detected.push('experiência geral')
    }

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    if (rating >= 4.0) sentiment = 'positive'
    else if (rating <= 2.5) sentiment = 'negative'
    else sentiment = 'neutral'

    return { sentiment, topics: detected }
  }

  public resetToDefault() {
    this.reviews = initialReviews
    this.save()
  }
}

export const reviewService = new ReviewStore()
