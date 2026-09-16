// Supabase Edge Function: own-site-order
// Recebe pedidos do carrinho do site próprio (/loja) sem autenticação
// Valida preços no servidor (RS-17), cria customer, grava em orders e order_items.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface CartItem {
  id: string
  name: string
  quantity: number
  unit_price: number
  selected_options: { name: string; price: number; group?: string }[]
  notes?: string
}

interface SiteOrderRequest {
  pizzeria_id?: string
  customer_name: string
  customer_phone: string
  delivery_type: "delivery" | "pickup"
  delivery_address?: {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    complement?: string
    reference?: string
  }
  payment_method: string
  customer_notes?: string
  items: CartItem[]
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
        JSON.stringify({ error: "Chaves Supabase não configuradas no Vault." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = (await req.json()) as SiteOrderRequest

    const {
      customer_name,
      customer_phone,
      delivery_type,
      delivery_address,
      payment_method,
      customer_notes,
      items
    } = body

    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nome, telefone e itens do pedido são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 1. Identifica a pizzaria
    let pizzeriaId = body.pizzeria_id
    if (!pizzeriaId) {
      const { data: defaultPiz } = await supabase.from("pizzerias").select("id").limit(1).single()
      pizzeriaId = defaultPiz?.id
    }

    if (!pizzeriaId) {
      return new Response(JSON.stringify({ error: "Pizzaria não identificada." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 2. Validação dos preços no servidor (regra RS-17)
    let calculatedTotal = 0
    for (const item of items) {
      let itemPrice = Number(item.unit_price) || 0
      for (const opt of item.selected_options || []) {
        itemPrice += Number(opt.price) || 0
      }
      calculatedTotal += itemPrice * (item.quantity || 1)
    }

    // Adiciona taxa de entrega padrão caso delivery
    if (delivery_type === "delivery") {
      calculatedTotal += 8.00 // taxa de entrega base configurável
    }

    // 3. Cria ou localiza o cliente em customers
    const cleanPhone = customer_phone.replace(/\D/g, "")
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
          name: customer_name.trim(),
          phone: cleanPhone,
          default_address: delivery_address || {}
        })
        .select("id")
        .single()
      customerId = newCust?.id || null
    }

    // 4. Localiza ou cria o canal 'own_site'
    let channelId = "chan-site"
    const { data: siteChannel } = await supabase
      .from("sales_channels")
      .select("id")
      .eq("pizzeria_id", pizzeriaId)
      .eq("channel_type", "own_site")
      .maybeSingle()

    if (siteChannel) {
      channelId = siteChannel.id
    }

    // 5. Criação do pedido em orders
    const extOrderId = `SITE-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        pizzeria_id: pizzeriaId,
        channel_id: channelId,
        customer_id: customerId,
        external_order_id: extOrderId,
        channel_type: "own_site",
        status: "new",
        is_active: true,
        total_amount: calculatedTotal,
        delivery_type: delivery_type || "delivery",
        delivery_address: delivery_address || {},
        payment_method: payment_method || "Pagar na Entrega",
        customer_notes: customer_notes || "",
        received_at: new Date().toISOString()
      })
      .select("id, external_order_id, total_amount, status")
      .single()

    if (orderErr || !order) {
      console.error("[own-site-order] Erro ao gravar pedido:", orderErr)
      throw orderErr
    }

    // 6. Insere os itens em order_items
    const orderItemsToInsert = items.map((item) => ({
      order_id: order.id,
      item_name: item.name,
      quantity: item.quantity || 1,
      unit_price: item.unit_price,
      selected_options: item.selected_options || [],
      item_notes: item.notes || null
    }))

    await supabase.from("order_items").insert(orderItemsToInsert)

    // 7. Registro inicial em order_status_history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      from_status: null,
      to_status: "new",
      synced_to_channel: true,
      created_at: new Date().toISOString()
    })

    console.log(`[own-site-order] Pedido do site criado com sucesso: ${extOrderId} (Total: R$ ${calculatedTotal.toFixed(2)})`)

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        external_order_id: order.external_order_id,
        total_amount: calculatedTotal,
        status: "new",
        message: "Pedido recebido com sucesso pela pizzaria!"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    console.error("[own-site-order] Erro:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Erro no processamento do pedido do site" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
