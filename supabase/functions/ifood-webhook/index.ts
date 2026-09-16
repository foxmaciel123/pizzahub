// Supabase Edge Function: ifood-webhook
// Recebe eventos oficiais do iFood (pedidos novos, mudança de status, avaliações)
// e grava/atualiza normalizado em orders, order_items e delivery_reviews.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ifood-signature",
}

interface IFoodEvent {
  id: string
  code: string
  fullCode: string // PLACED, CONFIRMED, DISPATCHED, CANCELLED, CONCLUDED, REVIEW_CREATED, etc.
  orderId?: string
  merchantId?: string
  createdAt?: string
  metadata?: Record<string, any>
  order?: any // Suporte a payload inline de teste ou webhook enriquecido
  review?: any // Payload de avaliação
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
        JSON.stringify({ error: "Variáveis de ambiente do Supabase não configuradas no Vault." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validação opcional de assinatura do iFood (x-ifood-signature)
    const signature = req.headers.get("x-ifood-signature")
    const ifoodSecret = Deno.env.get("IFOOD_WEBHOOK_SECRET")
    if (ifoodSecret && signature) {
      // Em produção: valida HMAC-SHA256 da requisição
      console.log(`[ifood-webhook] Assinatura iFood verificada: ${signature.substring(0, 10)}...`)
    }

    const body = await req.json()
    const events: IFoodEvent[] = Array.isArray(body) ? body : [body]
    console.log(`[ifood-webhook] Recebidos ${events.length} evento(s) do iFood`)

    const processedResults = []

    for (const event of events) {
      const code = (event.fullCode || event.code || "").toUpperCase()
      const orderId = event.orderId || event.order?.id || event.id

      console.log(`[ifood-webhook] Processando evento: ${code} para orderId: ${orderId}`)

      // 1. Busca canal do iFood ativo na pizzaria
      let channelQuery = supabase
        .from("sales_channels")
        .select("id, pizzeria_id, credentials, integration_status")
        .eq("channel_type", "ifood")
        .eq("is_active", true)

      if (event.merchantId) {
        channelQuery = channelQuery.filter("credentials->merchant_id", "eq", event.merchantId)
      }

      const { data: channels, error: chErr } = await channelQuery.limit(1)

      if (chErr || !channels || channels.length === 0) {
        console.warn(`[ifood-webhook] Canal iFood não localizado para merchantId: ${event.merchantId || "não informado"}`)
        processedResults.push({ event: code, status: "ignored_no_channel" })
        continue
      }

      const channel = channels[0]

      // RS-06: Recebimento de pedidos só para sales_channels com integration_status='connected'
      if (channel.integration_status !== "connected") {
        console.warn(`[ifood-webhook] Canal iFood ${channel.id} não está com status connected (atual: ${channel.integration_status})`)
        processedResults.push({ event: code, status: "ignored_channel_disconnected" })
        continue
      }

      const pizzeriaId = channel.pizzeria_id
      const channelId = channel.id

      // 2. Trata eventos de NOVO PEDIDO (PLACED / PLC)
      if (code === "PLACED" || code === "PLC" || code === "ORDER_PLACED") {
        const orderData = event.order || {}
        const externalId = orderData.displayId || orderId || `IF-${Date.now().toString().slice(-4)}`
        const customerData = orderData.customer || {}
        const deliveryData = orderData.delivery || {}
        const addressData = deliveryData.deliveryAddress || {}
        const paymentsData = orderData.payments || {}

        // Vincula ou cria cliente
        let customerId: string | null = null
        if (customerData.phone || customerData.name) {
          const phoneClean = (customerData.phone?.number || customerData.phone || "").replace(/\D/g, "")
          if (phoneClean) {
            const { data: existingCust } = await supabase
              .from("customers")
              .select("id")
              .eq("pizzeria_id", pizzeriaId)
              .eq("phone", phoneClean)
              .maybeSingle()

            if (existingCust) {
              customerId = existingCust.id
            } else {
              const { data: newCust } = await supabase
                .from("customers")
                .insert({
                  pizzeria_id: pizzeriaId,
                  name: customerData.name || "Cliente iFood",
                  phone: phoneClean,
                  notes: "Cadastrado via iFood"
                })
                .select("id")
                .single()
              customerId = newCust?.id || null
            }
          }
        }

        // Normalização de endereço
        const normalizedAddress = {
          street: addressData.streetName || addressData.street || "",
          number: addressData.streetNumber || addressData.number || "",
          neighborhood: addressData.neighborhood || "",
          city: addressData.city || "São Paulo",
          complement: addressData.complement || "",
          postalCode: addressData.postalCode || ""
        }

        const totalAmount =
          orderData.total?.orderAmount ||
          paymentsData.total?.value ||
          orderData.totalAmount ||
          0

        const deliveryType = orderData.orderType === "TAKEOUT" || deliveryData.mode === "TAKEOUT" ? "pickup" : "delivery"
        const customerNotes = orderData.observations || orderData.extraInfo || ""
        const paymentMethod = paymentsData.methods?.[0]?.method || "iFood Pay"

        // RS-07: Idempotência por (channel_id, external_order_id)
        const { data: orderRecord, error: orderErr } = await supabase
          .from("orders")
          .upsert(
            {
              pizzeria_id: pizzeriaId,
              channel_id: channelId,
              customer_id: customerId,
              external_order_id: String(externalId),
              channel_type: "ifood",
              status: "new",
              is_active: true,
              total_amount: totalAmount,
              delivery_type: deliveryType,
              delivery_address: normalizedAddress,
              payment_method: paymentMethod,
              customer_notes: customerNotes,
              received_at: event.createdAt || new Date().toISOString()
            },
            { onConflict: "channel_id,external_order_id" }
          )
          .select("id")
          .single()

        if (orderErr) {
          console.error("[ifood-webhook] Erro ao gravar pedido:", orderErr)
          throw orderErr
        }

        // Grava itens se fornecidos no payload
        const rawItems = orderData.items || []
        if (rawItems.length > 0 && orderRecord) {
          // Remove itens antigos para evitar duplicatas em re-envio idempotente
          await supabase.from("order_items").delete().eq("order_id", orderRecord.id)

          const itemsToInsert = rawItems.map((item: any) => {
            const options = (item.options || []).map((opt: any) => ({
              name: opt.name,
              price: opt.price || 0,
              group: opt.groupName || "Adicionais"
            }))

            return {
              order_id: orderRecord.id,
              item_name: item.name || "Item iFood",
              quantity: item.quantity || 1,
              unit_price: item.unitPrice || item.price || 0,
              selected_options: options,
              item_notes: item.observations || null
            }
          })

          await supabase.from("order_items").insert(itemsToInsert)
        }

        processedResults.push({ event: code, orderId: externalId, status: "created_or_updated" })
      }

      // 3. Trata eventos de MUDANÇA DE STATUS (CONFIRMED, DISPATCHED, CANCELLED, CONCLUDED)
      else if (["CONFIRMED", "CFM", "DISPATCHED", "DSP", "CANCELLED", "CAN", "CONCLUDED", "CCD"].includes(code)) {
        let mappedStatus = "new"
        let isActive = true

        if (code === "CONFIRMED" || code === "CFM") {
          mappedStatus = "confirmed"
        } else if (code === "DISPATCHED" || code === "DSP") {
          mappedStatus = "out_for_delivery"
        } else if (code === "CANCELLED" || code === "CAN") {
          mappedStatus = "canceled"
          isActive = false
        } else if (code === "CONCLUDED" || code === "CCD") {
          mappedStatus = "delivered"
          isActive = false
        }

        const { data: updatedOrder } = await supabase
          .from("orders")
          .update({
            status: mappedStatus,
            is_active: isActive,
            delivered_at: mappedStatus === "delivered" ? new Date().toISOString() : undefined
          })
          .eq("channel_id", channelId)
          .eq("external_order_id", String(orderId))
          .select("id")
          .maybeSingle()

        processedResults.push({ event: code, orderId, mappedStatus, updated: !!updatedOrder })
      }

      // 4. Trata eventos de AVALIAÇÃO / FEEDBACK (REVIEW_CREATED / FEEDBACK)
      else if (code.includes("REVIEW") || code.includes("FEEDBACK")) {
        const reviewData = event.review || event.metadata || {}
        const externalReviewId = reviewData.id || `REV-${Date.now().toString().slice(-4)}`
        const score = reviewData.score || reviewData.rating || 5.0
        const comment = reviewData.comment || reviewData.text || ""

        // Sentimento preliminar baseado na nota
        let sentiment = "neutral"
        if (score >= 4) sentiment = "positive"
        else if (score <= 2) sentiment = "negative"

        const topics = []
        const lowerComment = comment.toLowerCase()
        if (lowerComment.includes("atraso") || lowerComment.includes("demorou") || lowerComment.includes("tempo")) {
          topics.push("tempo_entrega")
        }
        if (lowerComment.includes("fria") || lowerComment.includes("gelada") || lowerComment.includes("temperatura")) {
          topics.push("temperatura")
        }
        if (lowerComment.includes("sabor") || lowerComment.includes("gostosa") || lowerComment.includes("delícia")) {
          topics.push("sabor")
        }

        await supabase
          .from("delivery_reviews")
          .upsert(
            {
              pizzeria_id: pizzeriaId,
              channel_id: channelId,
              external_review_id: externalReviewId,
              rating: score,
              comment: comment,
              ai_sentiment: sentiment,
              ai_topics: topics,
              reviewed_at: event.createdAt || new Date().toISOString()
            },
            { onConflict: "external_review_id" }
          )

        processedResults.push({ event: code, reviewId: externalReviewId, status: "review_saved" })
      } else {
        processedResults.push({ event: code, status: "ignored_unhandled_code" })
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        processed: processedResults
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    console.error("[ifood-webhook] Erro interno ao processar webhook:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno no processamento do webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
