// Supabase Edge Function: whatsapp-webhook
// Recebe mensagens via Evolution API (ou WhatsApp Cloud API)
// e roteia para ai-agent-reply ou marca needs_human=true.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Chaves de serviço Supabase não configuradas no Vault." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json()

    console.log("[whatsapp-webhook] Evento recebido da Evolution API:", JSON.stringify(body).slice(0, 250))

    // Formato Evolution API: body.data.key ou body.key ou body.message
    const data = body.data || body
    const key = data.key || {}
    const message = data.message || {}

    // Ignora mensagens enviadas pelo próprio número (fromMe)
    if (key.fromMe) {
      return new Response(JSON.stringify({ status: "ignored_from_me" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Extrai telefone limpo do remetente
    const remoteJid = key.remoteJid || data.sender || data.from || ""
    const cleanPhone = remoteJid.replace(/@s\.whatsapp\.net|@c\.us|@g\.us/g, "").replace(/\D/g, "")

    if (!cleanPhone) {
      return new Response(JSON.stringify({ status: "ignored_no_phone" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Extrai texto da mensagem
    const textContent =
      message.conversation ||
      message.extendedTextMessage?.text ||
      data.text ||
      data.body ||
      ""

    if (!textContent.trim()) {
      return new Response(JSON.stringify({ status: "ignored_empty_content" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const pushName = data.pushName || data.name || "Cliente WhatsApp"

    // 1. Identifica a pizzaria associada ao canal WhatsApp (ou padrão inicial)
    const { data: channel } = await supabase
      .from("sales_channels")
      .select("id, pizzeria_id")
      .eq("channel_type", "whatsapp")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    // Busca qualquer pizzaria ativa caso não haja canal específico
    let pizzeriaId = channel?.pizzeria_id
    if (!pizzeriaId) {
      const { data: anyPizzeria } = await supabase.from("pizzerias").select("id").limit(1).single()
      pizzeriaId = anyPizzeria?.id
    }

    if (!pizzeriaId) {
      return new Response(JSON.stringify({ error: "Nenhuma pizzaria cadastrada para receber mensagens." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 2. Busca ou cadastra o cliente
    let customerId: string | null = null
    const { data: existingCust } = await supabase
      .from("customers")
      .select("id")
      .eq("pizzeria_id", pizzeriaId)
      .eq("phone", cleanPhone)
      .maybeSingle()

    if (existingCust) {
      customerId = existingCust.id
    } else {
      const { data: newCust } = await supabase
        .from("customers")
        .insert({
          pizzeria_id: pizzeriaId,
          name: pushName,
          phone: cleanPhone
        })
        .select("id")
        .single()
      customerId = newCust?.id || null
    }

    // 3. Busca ou inicia conversa em whatsapp_conversations (regra RS-13)
    let conversationId: string
    let handledBy: "ai" | "human" = "ai"
    let needsHuman = false

    const { data: existingConv } = await supabase
      .from("whatsapp_conversations")
      .select("id, handled_by, needs_human")
      .eq("pizzeria_id", pizzeriaId)
      .eq("customer_phone", cleanPhone)
      .maybeSingle()

    if (existingConv) {
      conversationId = existingConv.id
      handledBy = existingConv.handled_by as "ai" | "human"
      needsHuman = existingConv.needs_human
    } else {
      const { data: newConv, error: convErr } = await supabase
        .from("whatsapp_conversations")
        .insert({
          pizzeria_id: pizzeriaId,
          customer_id: customerId,
          customer_phone: cleanPhone,
          handled_by: "ai",
          needs_human: false,
          last_message_at: new Date().toISOString()
        })
        .select("id")
        .single()

      if (convErr || !newConv) throw convErr
      conversationId = newConv.id
    }

    // 4. Grava a mensagem do cliente em whatsapp_messages
    const { data: insertedMsg, error: msgErr } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversationId,
        direction: "inbound",
        sender: "customer",
        content: textContent.trim(),
        created_at: new Date().toISOString()
      })
      .select("id")
      .single()

    if (msgErr) throw msgErr

    // 5. Validação de gatilhos de escalonamento para humano (regra RS-15)
    const lower = textContent.toLowerCase()
    const triggers = [
      "falar com atendente",
      "humano",
      "pessoa",
      "atendente",
      "reclama",
      "cancelar",
      "problema com pedido",
      "cadê meu pedido",
      "gerente",
      "errado"
    ]
    const hasEscalationTrigger = triggers.some((t) => lower.includes(t))

    if (hasEscalationTrigger || handledBy === "human") {
      console.log(`[whatsapp-webhook] Transbordo ativado para a conversa ${conversationId} (Gatilho: ${hasEscalationTrigger})`)
      await supabase
        .from("whatsapp_conversations")
        .update({
          needs_human: true,
          handled_by: "human",
          last_message_at: new Date().toISOString()
        })
        .eq("id", conversationId)

      return new Response(
        JSON.stringify({
          status: "escalated_to_human",
          conversation_id: conversationId,
          message_id: insertedMsg.id
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 6. Roteia para ai-agent-reply se a IA estiver no controle
    await supabase
      .from("whatsapp_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId)

    console.log(`[whatsapp-webhook] Invocando ai-agent-reply para conversa ${conversationId}`)
    try {
      await supabase.functions.invoke("ai-agent-reply", {
        body: {
          conversation_id: conversationId,
          message_id: insertedMsg.id,
          content: textContent,
          customer_phone: cleanPhone,
          customer_name: pushName,
          pizzeria_id: pizzeriaId
        }
      })
    } catch (e: any) {
      console.warn("[whatsapp-webhook] Aviso ao invocar ai-agent-reply:", e.message)
    }

    return new Response(
      JSON.stringify({
        status: "routed_to_ai",
        conversation_id: conversationId,
        message_id: insertedMsg.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    console.error("[whatsapp-webhook] Erro no processamento:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Erro no processamento do webhook do WhatsApp" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
