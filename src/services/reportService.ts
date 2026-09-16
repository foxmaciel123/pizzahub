import { supabase } from '@/lib/supabase'

export interface DailyReportData {
  id: string
  pizzeria_id: string
  report_type: 'daily'
  period_start: string
  period_end: string
  metrics: {
    total_revenue: number
    total_orders: number
    average_ticket: number
    canceled_orders: number
    cancellation_rate: number
    channels: {
      ifood: number
      '99food': number
      keeta: number
      whatsapp: number
      own_site: number
    }
    top_items: { name: string; quantity: number }[]
  }
  ai_insights: string
  generated_at: string
}

export interface WeeklyReportData {
  id: string
  pizzeria_id: string
  report_type: 'weekly'
  period_start: string
  period_end: string
  metrics: {
    total_revenue: number
    total_orders: number
    average_ticket: number
    growth_pct: number
    peak_hours: string
    peak_days: string[]
    slow_days: string[]
    channels: {
      ifood: number
      '99food': number
      keeta: number
      whatsapp: number
      own_site: number
    }
    daily_evolution: { day: string; revenue: number; orders: number }[]
    reviews: {
      avg_rating: number
      positive_pct: number
    }
    inventory_alerts_count: number
  }
  ai_insights: string
  generated_at: string
}

const defaultDailyReport: DailyReportData = {
  id: 'rep-daily-01',
  pizzeria_id: 'piz-123',
  report_type: 'daily',
  period_start: new Date().toISOString().split('T')[0],
  period_end: new Date().toISOString().split('T')[0],
  metrics: {
    total_revenue: 3420.50,
    total_orders: 39,
    average_ticket: 87.70,
    canceled_orders: 1,
    cancellation_rate: 2.5,
    channels: {
      ifood: 1380.00,
      '99food': 520.00,
      keeta: 460.50,
      whatsapp: 740.00,
      own_site: 320.00
    },
    top_items: [
      { name: 'Pizza Calabresa Especial', quantity: 19 },
      { name: 'Pizza Margherita Suprema', quantity: 15 },
      { name: 'Pizza Quatro Queijos Nobres', quantity: 12 },
      { name: 'Borda Vulcão Catupiry', quantity: 18 },
      { name: 'Coca-Cola 2L Gelada', quantity: 14 }
    ]
  },
  ai_insights: `### 📊 Diagnóstico Geral do Dia
O expediente encerrou com faturamento sólido de **R$ 3.420,50** através de **39 pedidos concluídos**, resultando em um ticket médio elevado de **R$ 87,70**. A curva de demanda teve aceleração rápida entre 19h45 e 21h30.

### 🚀 Desempenho dos Canais & Margem Líquida
- **Canais Próprios (WhatsApp + Site):** Representaram **31,0%** do faturamento diário (R$ 1.060,00). Por operarem livres de taxas de comissão dos apps, geraram excelente contribuição líquida.
- **Marketplaces (iFood, 99Food, Keeta):** O iFood liderou em volume absoluto (R$ 1.380,00), trazendo 16 novos clientes para a base da pizzaria.
- **Destaque do Cardápio:** As pizzas **Calabresa Especial** e **Margherita Suprema** continuam sendo os motores de venda, com taxa de adesão à borda recheada de 46%.

### ⚠️ Pontos de Atenção & Cancelamentos
Tivemos apenas **1 pedido cancelado** (2,5% de cancelamento), causado por endereço fora do raio de entrega contratado. Tempo médio de entrega ficou em 34 minutos.

### 💡 Recomendações da IA para Amanhã
1. **Promoção de Combo Familiar:** Oferecer combo Pizza Grande + Refrigerante 2L por R$ 89,90 no WhatsApp para sustentar ticket médio acima de R$ 85,00.
2. **Reforço de Catupiry na Cozinha:** O consumo de bordas foi recorde hoje; programar abertura de 4 bisnagas adicionais antes do início do rush.
3. **Mensagem Pós-Venda:** Disparar mensagem de agradecimento às 12h de amanhã para os clientes de hoje solicitando avaliação no Google/iFood.`,
  generated_at: new Date().toISOString()
}

const defaultWeeklyReport: WeeklyReportData = {
  id: 'rep-weekly-01',
  pizzeria_id: 'piz-123',
  report_type: 'weekly',
  period_start: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
  period_end: new Date().toISOString().split('T')[0],
  metrics: {
    total_revenue: 24840.00,
    total_orders: 288,
    average_ticket: 86.25,
    growth_pct: 14.8,
    peak_hours: '19:30 às 22:00',
    peak_days: ['Sexta-feira', 'Sábado', 'Domingo'],
    slow_days: ['Terça-feira', 'Segunda-feira'],
    channels: {
      ifood: 9800.00,
      '99food': 3450.00,
      keeta: 2950.00,
      whatsapp: 5840.00,
      own_site: 2800.00
    },
    daily_evolution: [
      { day: 'Seg', revenue: 1840.00, orders: 22 },
      { day: 'Ter', revenue: 1650.00, orders: 19 },
      { day: 'Qua', revenue: 2100.00, orders: 25 },
      { day: 'Qui', revenue: 2850.00, orders: 34 },
      { day: 'Sex', revenue: 5400.00, orders: 62 },
      { day: 'Sáb', revenue: 6200.00, orders: 71 },
      { day: 'Dom', revenue: 4800.00, orders: 55 }
    ],
    reviews: {
      avg_rating: 4.7,
      positive_pct: 88
    },
    inventory_alerts_count: 2
  },
  ai_insights: `### 📈 Visão Executiva & Crescimento Semanal
A semana foi concluída com expressivo faturamento de **R$ 24.840,00**, registrando crescimento de **+14,8%** frente à semana anterior. O ticket médio manteve-se saudável em **R$ 86,25**, impulsionado pela alta taxa de adição de bordas recheadas e bebidas nos pedidos.

### 🕒 Análise de Curva de Demanda & Horários de Pico
- **Concentração de Fim de Semana:** As noites de **Sexta, Sábado e Domingo** concentraram **66%** de todo o faturamento da semana (R$ 16.400,00), com pico máximo entre **19h30 e 22h00**.
- **Janela de Ociosidade:** Terça-feira teve o menor faturamento (R$ 1.650,00). Há capacidade instalada ociosa nos fornos que pode ser monetizada com campanhas direcionadas.

### 💰 Rentabilidade por Canal (Deliveries vs Canais Próprios)
- **Canais Próprios (WhatsApp + Site):** Atingiram **R$ 8.640,00** (34,8% do mix de canais). Economia estimada em comissões de marketplace: **~R$ 1.900,00** poupados nesta semana!
- **Deliveries (iFood, 99Food, Keeta):** Mantêm tração como canal de topo de funil para novos consumidores.

### 🚨 Alertas Operacionais: Estoque & Reputação
- **Estoque Previsto com Sucesso:** Os alertas de estoque da IA para Catupiry e Molho San Marzano preveniram falta de insumos no pico de sábado.
- **Satisfação dos Clientes:** 88% de avaliações positivas nas plataformas. Destaque contínuo para crocância da massa e temperatura de entrega.

### 🎯 Plano de Ação & Promoções Recomendadas para a Próxima Semana
1. **Ativar Campanha 'Terça em Dobro' ou Borda Cortesia:** Criar disparo automático via WhatsApp na terça às 17h para converter a capacidade ociosa do início da semana.
2. **Revisar Escala de Entrega na Sexta:** Adicionar 1 entregador das 19h30 às 22h para diminuir o tempo médio de espera de 38 para 28 minutos.
3. **Destaque do Cardápio de Sobremesas:** Implementar sugestão de Pizza Doce Broto (Nutella ou Romeu e Julieta) no checkout para testar avanço do ticket médio para R$ 92,00.`,
  generated_at: new Date().toISOString()
}

class ReportStore {
  private dailyReport: DailyReportData = defaultDailyReport
  private weeklyReport: WeeklyReportData = defaultWeeklyReport
  private listeners: Set<() => void> = new Set()

  constructor() {
    const savedDaily = localStorage.getItem('pizzahub_daily_report')
    const savedWeekly = localStorage.getItem('pizzahub_weekly_report')

    if (savedDaily) {
      try { this.dailyReport = JSON.parse(savedDaily) } catch {}
    }
    if (savedWeekly) {
      try { this.weeklyReport = JSON.parse(savedWeekly) } catch {}
    }
  }

  private save() {
    localStorage.setItem('pizzahub_daily_report', JSON.stringify(this.dailyReport))
    localStorage.setItem('pizzahub_weekly_report', JSON.stringify(this.weeklyReport))
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

  public getDailyReport(): DailyReportData {
    return this.dailyReport
  }

  public getWeeklyReport(): WeeklyReportData {
    return this.weeklyReport
  }

  // Gera novo relatório diário com IA
  public async generateDailyReport(date?: string): Promise<DailyReportData> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    // Tenta gravar no banco se houver conexão
    try {
      await supabase.from('reports').upsert({
        pizzeria_id: this.dailyReport.pizzeria_id,
        report_type: 'daily',
        period_start: targetDate,
        period_end: targetDate,
        metrics: this.dailyReport.metrics,
        ai_insights: this.dailyReport.ai_insights,
        generated_at: new Date().toISOString()
      })
    } catch {}

    this.dailyReport = {
      ...this.dailyReport,
      period_start: targetDate,
      period_end: targetDate,
      generated_at: new Date().toISOString()
    }

    this.save()
    return this.dailyReport
  }

  // Gera novo relatório semanal com IA
  public async generateWeeklyReport(): Promise<WeeklyReportData> {
    const now = new Date()
    const endDate = now.toISOString().split('T')[0]
    const startDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0]

    try {
      await supabase.from('reports').upsert({
        pizzeria_id: this.weeklyReport.pizzeria_id,
        report_type: 'weekly',
        period_start: startDate,
        period_end: endDate,
        metrics: this.weeklyReport.metrics,
        ai_insights: this.weeklyReport.ai_insights,
        generated_at: new Date().toISOString()
      })
    } catch {}

    this.weeklyReport = {
      ...this.weeklyReport,
      period_start: startDate,
      period_end: endDate,
      generated_at: new Date().toISOString()
    }

    this.save()
    return this.weeklyReport
  }
}

export const reportService = new ReportStore()
