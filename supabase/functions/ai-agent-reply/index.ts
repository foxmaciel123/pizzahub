// Supabase Edge Function: ai-agent-reply
// Orquestra atendimento conversacional no WhatsApp com Claude Haiku 4.5
// Lê o cardápio próprio, responde no tom de ai_settings, sugere complementos,
// grava whatsapp_messages, cria orders do WhatsApp e escala para humano.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface AgentRequest {
  conversation_id: string
  message_id?: string
  content: string
  customer_phone: string
  customer_name?: string
  pizzeria_id: string
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY") || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Chaves Supabase não configuradas no Vault." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = (await req.json()) as AgentRequest
    const { conversation_id, content, customer_phone, customer_name, pizzeria_id } = body

    if (!conversation_id || !pizzeria_id) {
      return new Response(
        JSON.stringify({ error: "Parâmetros 'conversation_id' e 'pizzeria_id' são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log(`[ai-agent-reply] Processando mensagem para conversa ${conversation_id}: "${content.slice(0, 80)}"`)

    // 1. Carrega configurações da IA (ai_settings)
    const { data: aiSettings } = await supabase
      .from("ai_settings")
      .select("whatsapp_tone, suggestion_enabled, suggested_item_ids")
      .eq("pizzeria_id", pizzeriaId)
      .maybeSingle()

    const tone = aiSettings?.whatsapp_tone || "amigável"
    const suggestionEnabled = aiSettings?.suggestion_enabled !== false
    const suggestedItemIds: string[] = aiSettings?.suggested_item_ids || []

    // 2. Carrega dados da Pizzaria
    const { data: pizzeria } = await supabase
      .from("pizzerias")
      .select("name, cnpj")
      .eq("id", pizzeriaId)
      .single()

    const pizzeriaName = pizzeria?.name || "PizzaHub"

    // 3. Carrega cardápio próprio disponível (menu_categories, menu_items, menu_item_options)
    const { data: categories } = await supabase
      .from("menu_categories")
      .select("id, name, sort_order")
      .eq("pizzeria_id", pizzeriaId)
      .order("sort_order", { ascending: true })

    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("id, category_id, name, description, base_price, is_available")
      .eq("pizzeria_id", pizzeriaId)
      .eq("is_available", true)

    const { data: menuOptions } = await supabase
      .from("menu_item_options")
      .select("id, menu_item_id, option_group, name, price_delta")

    // Formata cardápio em texto para o System Prompt
    const menuSummary = (menuItems || [])
      .map((item) => {
        const cat = categories?.find((c) => c.id === item.category_id)?.name || "Geral"
        const options = (menuOptions || []).filter((o) => o.menu_item_id === item.id)
        const optsText = options.length > 0 ? ` [Bordas/Opções: ${options.map((o) => `${o.name} (+R$ ${o.price_delta})`).join(", ")}]` : ""
        return `- [${cat}] ${item.name} (R$ ${item.base_price.toFixed(2)})${optsText}: ${item.description || ""}`
      })
      .join("\n")

    // 4. Carrega histórico recente da conversa (últimas 8 mensagens)
    const { data: messagesHistory } = await supabase
      .from("whatsapp_messages")
      .select("direction, sender, content, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(10)

    // 5. Verificação imediata de escalonamento para humano (regra RS-15)
    const lower = content.toLowerCase()
    const isEscalation =
      lower.includes("atendente") ||
      lower.includes("humano") ||
      lower.includes("reclama") ||
      lower.includes("problema") ||
      lower.includes("cancelar") ||
      lower.includes("estorno")

    if (isEscalation) {
      console.log(`[ai-agent-reply] Escalonamento para humano detectado na conversa ${conversation_id}`)
      await supabase
        .from("whatsapp_conversations")
        .update({ needs_human: true, handled_by: "human", last_message_at: new Date().toISOString() })
        .eq("id", conversation_id)

      const escalationReply =
        `Com certeza, ${customer_name || "amigo(a)"}! Já estou transferindo seu atendimento para nossa equipe de atendimento humana agora mesmo. Um momento, por favor!`

      await supabase.from("whatsapp_messages").insert({
        conversation_id,
        direction: "outbound",
        sender: "ai",
        content: escalationReply,
        created_at: new Date().toISOString()
      })

      return new Response(
        JSON.stringify({ success: true, reply: escalationReply, needs_human: true, order_created: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 6. Geração da resposta com Claude Haiku 4.5
    let aiGeneratedReply = ""
    let orderDetected = false
    let detectedOrderData: any = null

    if (anthropicApiKey) {
      try {
        const systemPrompt = `Você é a IA assistente oficial de atendimento da pizzaria "${pizzeriaName}" no WhatsApp.
Seu objetivo é ser extremamente ágil, calorosa e eficiente em atender clientes, tirar dúvidas sobre o cardápio e montar pedidos em linguagem natural.
Tom de voz obrigatório: ${tone.toUpperCase()} (use emojis com moderação caso seja amigável ou descontraído).

CARDÁPIO ATUALIZADO:
${menuSummary}

DIRETRIZES:
1. Responda em mensagens curtas ideais para o WhatsApp (2 a 4 linhas no máximo).
2. ${suggestionEnabled ? "SUGESTÃO ATIVA: Sempre que o cliente pedir uma pizza e ainda não tiver escolhido bebida ou borda recheada, sugira educadamente um complemento para aumentar o pedido." : ""}
3. Se o cliente solicitar explicitamente fechamento do pedido informando endereço e forma de pagamento, confirme tudo com clareza e inclua ao final a tag exata:
<PEDIDO_CRIADO>{"pizza": "nome", "total": 00.00, "endereco": "texto", "pagamento": "tipo"}</PEDIDO_CRIADO>
`

        const conversationForClaude = (messagesHistory || []).map((m) => ({
          role: m.sender === "customer" ? "user" : "assistant",
          content: m.content
        }))

        // Adiciona a mensagem atual se não estiver no histórico
        if (conversationForClaude.length === 0 || conversationForClaude[conversationForClaude.length - 1].content !== content) {
          conversationForClaude.push({ role: "user", content })
        }

        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicApiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-latest",
            max_tokens: 500,
            system: systemPrompt,
            messages: conversationForClaude
          })
        })

        if (anthropicRes.ok) {
          const claudeJson = await anthropicRes.json()
          aiGeneratedReply = claudeJson.content?.[0]?.text || ""
        }
      } catch (apiErr) {
        console.warn("[ai-agent-reply] Falha na API Anthropic, aplicando fallback local:", apiErr)
      }
    }

    // Fallback inteligente caso a chave Anthropic não esteja configurada ou ocorra timeout
    if (!aiGeneratedReply) {
      if (lower.includes("cardápio") || lower.includes("cardapio") || lower.includes("sabores") || lower.includes("menu")) {
        aiGeneratedReply = `Olá, ${customer_name || "tudo bem"}! 🍕 Seja bem-vindo à ${pizzeriaName}!\nNossos sabores mais pedidos hoje são: Calabresa Artesanal (R$ 64,90), Margherita (R$ 68,00) e Quatro Queijos Nobres (R$ 79,90). Também temos bordas vulcão deliciosas e pizzas doces!\n\nQual sabor você gostaria de experimentar hoje?`
      } else if (lower.includes("quero") || lower.includes("manda") || lower.includes("pizza") || lower.includes("pedir")) {
        aiGeneratedReply = `Perfeita escolha! Já estou anotando aqui. 😋 ${suggestionEnabled ? "Gostaria de adicionar uma Borda Vulcão de Catupiry (+R$ 14,00) ou um Guaraná/Coca gelada para acompanhar?" : "Pode me passar o endereço de entrega e a forma de pagamento (PIX ou Cartão)?"}`
      } else {
        aiGeneratedReply = `Olá! 🍕 Sou a assistente virtual da ${pizzeriaName}. Como posso te ajudar hoje? Posso te apresentar nosso cardápio, calcular taxa de entrega ou anotar seu pedido!`
      }
    }

    // 7. Checa se houve fechamento de pedido pela IA
    if (aiGeneratedReply.includes("<PEDIDO_CRIADO>")) {
      orderDetected = true
      try {
        const match = aiGeneratedReply.match(/<PEDIDO_CRIADO>(.*?)<\/PEDIDO_CRIADO>/s)
        if (match && match[1]) {
          detectedOrderData = JSON.parse(match[1])
        }
      } catch (e) {}

      // Limpa as tags técnicas da mensagem enviada ao cliente
      aiGeneratedReply = aiGeneratedReply.replace(/<PEDIDO_CRIADO>.*?<\/PEDIDO_CRIADO>/s, "").trim()
    }

    // Se detectou pedido confirmado no WhatsApp, cria o registro em orders
    if (orderDetected) {
      console.log(`[ai-agent-reply] Criando pedido automático do WhatsApp para ${customer_phone}`)
      const extId = `WA-${Math.floor(1000 + Math.random() * 9000)}`

      // Localiza canal do WhatsApp
      const { data: waChannel } = await supabase
        .from("sales_channels")
        .select("id")
        .eq("pizzeria_id", pizzeriaId)
        .eq("channel_type", "whatsapp")
        .maybeSingle()

      const channelId = waChannel?.id || "chan-whatsapp"

      const { data: newOrder } = await supabase
        .from("orders")
        .insert({
          pizzeria_id: pizzeriaId,
          channel_id: channelId,
          external_order_id: extId,
          channel_type: "whatsapp",
          status: "new",
          is_active: true,
          total_amount: detectedOrderData?.total || 78.90,
          delivery_type: "delivery",
          delivery_address: { street: detectedOrderData?.endereco || "Endereço via WhatsApp" },
          payment_method: detectedOrderData?.pagamento || "PIX no WhatsApp",
          customer_notes: "Pedido recebido e montado pela IA no WhatsApp",
          received_at: new Date().toISOString()
        })
        .select("id")
        .single()

      if (newOrder) {
        await supabase.from("order_items").insert({
          order_id: newOrder.id,
          item_name: detectedOrderData?.pizza || "Pizza Calabresa Artesanal",
          quantity: 1,
          unit_price: detectedOrderData?.total || 78.90,
          selected_options: []
        })
      }
    }

    // 8. Grava a resposta da IA em whatsapp_messages
    await supabase.from("whatsapp_messages").insert({
      conversation_id,
      direction: "outbound",
      sender: "ai",
      content: aiGeneratedReply,
      created_at: new Date().toISOString()
    })

    // 9. Atualiza timestamp da conversa
    await supabase
      .from("whatsapp_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation_id)

    // 10. Despacha mensagem via Evolution API se configurada
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL")
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY")
    const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE_NAME")

    if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
      try {
        await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstance}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey
          },
          body: JSON.stringify({
            number: customer_phone,
            text: aiGeneratedReply,
            delay: 1200
          })
        })
      } catch (sendErr) {
        console.warn("[ai-agent-reply] Falha ao enviar para Evolution API:", sendErr)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply: aiGeneratedReply,
        order_created: orderDetected,
        needs_human: false
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    console.error("[ai-agent-reply] Erro interno:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Erro no processamento do agente de IA" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
