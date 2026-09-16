// Edge Function: analyze-reviews
// Analisa sentimento e extrai tópicos recorrentes de avaliações de delivery usando modelo de contexto longo (Gemini / GPT)
// Conforme docs/FUNCTIONS.md e db/schemas.sql

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface DeliveryReview {
  id: string
  pizzeria_id: string
  channel_id: string
  rating: number
  comment: string
  ai_sentiment?: string
  ai_topics?: string[]
}

// Classificação inteligente com IA de contexto longo ou fallback heurístico de alto padrão
async function analyzeReviewWithAI(
  comment: string,
  rating: number
): Promise<{ sentiment: 'positive' | 'neutral' | 'negative'; topics: string[] }> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY")
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")

  const prompt = `Analise a seguinte avaliação de um cliente de pizzaria em app de delivery (iFood/99Food/Keeta).
Nota do cliente: ${rating} de 5 estrelas.
Comentário do cliente: "${comment || 'Sem comentário por escrito'}"

Responda ESTRITAMENTE em formato JSON com as seguintes chaves:
{
  "sentiment": "positive" | "neutral" | "negative",
  "topics": ["lista", "de", "topicos", "recorrentes", "mencionados"]
}

Tópicos comuns podem incluir: "tempo de entrega", "temperatura da pizza", "massa crocante", "borda recheada", "embalagem", "sabor", "atendimento", "custo-benefício", "troca de item", "motoboy educado", etc.`

  // Tentativa 1: Google Gemini (Gemini 1.5/2.5 Pro)
  if (geminiApiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      )
      if (response.ok) {
        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          return {
            sentiment: parsed.sentiment || (rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral'),
            topics: Array.isArray(parsed.topics) ? parsed.topics : []
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao chamar Gemini API, usando fallback:", e)
    }
  }

  // Tentativa 2: OpenAI (GPT-4o / GPT-5)
  if (openaiApiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Você é um especialista em análise de sentimentos para pizzarias. Responda apenas com JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      })
      if (response.ok) {
        const data = await response.json()
        const content = data?.choices?.[0]?.message?.content
        if (content) {
          const parsed = JSON.parse(content)
          return {
            sentiment: parsed.sentiment || (rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral'),
            topics: Array.isArray(parsed.topics) ? parsed.topics : []
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao chamar OpenAI API, usando fallback:", e)
    }
  }

  // Fallback Inteligente baseado em NLP de regras e vocabulário semântico
  const text = (comment || "").toLowerCase()
  const detectedTopics: string[] = []

  // Tópicos
  if (text.includes("entrega") || text.includes("demor") || text.includes("rápido") || text.includes("chegou")) {
    detectedTopics.push("tempo de entrega")
  }
  if (text.includes("quente") || text.includes("fria") || text.includes("gelada") || text.includes("fumegando")) {
    detectedTopics.push("temperatura")
  }
  if (text.includes("borda") || text.includes("catupiry") || text.includes("cheddar") || text.includes("vulcão")) {
    detectedTopics.push("borda recheada")
  }
  if (text.includes("massa") || text.includes("fina") || text.includes("crocante") || text.includes("queimada")) {
    detectedTopics.push("qualidade da massa")
  }
  if (text.includes("sabor") || text.includes("delícia") || text.includes("maravilhosa") || text.includes("gostosa") || text.includes("ruim") || text.includes("salgada")) {
    detectedTopics.push("sabor")
  }
  if (text.includes("embalagem") || text.includes("caixa") || text.includes("revirada") || text.includes("aberta")) {
    detectedTopics.push("embalagem")
  }
  if (text.includes("motoboy") || text.includes("atendente") || text.includes("educado") || text.includes("gentil")) {
    detectedTopics.push("atendimento")
  }
  if (text.includes("preço") || text.includes("caro") || text.includes("barato") || text.includes("vale a pena")) {
    detectedTopics.push("custo-benefício")
  }
  if (detectedTopics.length === 0) {
    detectedTopics.push("experiência geral")
  }

  // Sentimento
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  const positiveWords = ["delícia", "maravilhosa", "ótima", "excelente", "perfeita", "rápido", "recomendo", "amei", "parabéns", "quente"]
  const negativeWords = ["ruim", "fria", "demorou", "atraso", "queimada", "salgada", "borrachuda", "nunca mais", "péssimo", "horrível", "falta"]

  let posCount = 0
  let negCount = 0
  positiveWords.forEach(w => { if (text.includes(w)) posCount++ })
  negativeWords.forEach(w => { if (text.includes(w)) negCount++ })

  if (rating >= 4 || posCount > negCount) {
    sentiment = 'positive'
  } else if (rating <= 2 || negCount > posCount) {
    sentiment = 'negative'
  } else {
    sentiment = 'neutral'
  }

  return { sentiment, topics: detectedTopics }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Body com parâmetros opcionais (review_id específico ou pizzeria_id)
    let reviewId: string | null = null
    let pizzeriaId: string | null = null
    try {
      const body = await req.json()
      reviewId = body?.review_id || null
      pizzeriaId = body?.pizzeria_id || null
    } catch {}

    // Busca avaliações que ainda não têm ai_sentiment preenchido
    let query = supabase
      .from("delivery_reviews")
      .select("id, pizzeria_id, channel_id, rating, comment, ai_sentiment, ai_topics")

    if (reviewId) {
      query = query.eq("id", reviewId)
    } else {
      query = query.is("ai_sentiment", null)
      if (pizzeriaId) {
        query = query.eq("pizzeria_id", pizzeriaId)
      }
    }

    const { data: reviewsToAnalyze, error: fetchError } = await query.limit(50)

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "Erro ao buscar avaliações para análise", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!reviewsToAnalyze || reviewsToAnalyze.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhuma avaliação pendente de análise encontrada",
          analyzed_count: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const analyzedList = []

    for (const review of reviewsToAnalyze) {
      const { sentiment, topics } = await analyzeReviewWithAI(review.comment, Number(review.rating))

      // Atualiza a avaliação no banco
      const { error: updateError } = await supabase
        .from("delivery_reviews")
        .update({
          ai_sentiment: sentiment,
          ai_topics: topics
        })
        .eq("id", review.id)

      if (!updateError) {
        analyzedList.push({
          review_id: review.id,
          rating: review.rating,
          comment: review.comment,
          ai_sentiment: sentiment,
          ai_topics: topics
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Análise de sentimentos e tópicos concluída com sucesso para ${analyzedList.length} avaliação(ões)`,
        analyzed_count: analyzedList.length,
        reviews: analyzedList
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno ao analisar avaliações" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
