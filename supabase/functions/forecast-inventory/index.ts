// Edge Function: forecast-inventory
// Calcula previsão de consumo de insumos com base nos pedidos e gera inventory_alerts com antecedência
// Conforme docs/FUNCTIONS.md e db/schemas.sql

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface InventoryItem {
  id: string
  pizzeria_id: string
  name: string
  unit: 'kg' | 'un' | 'l'
  current_quantity: number
  min_threshold: number
}

interface AiSettings {
  stock_alert_lead_hours: number
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parâmetros opcionais passados no body
    let targetPizzeriaId: string | null = null
    try {
      const body = await req.json()
      targetPizzeriaId = body?.pizzeria_id || null
    } catch {
      // Body vazio (ex: chamada de cron job)
    }

    // Busca pizzarias para processar
    let pizzeriasQuery = supabase.from("pizzerias").select("id, name")
    if (targetPizzeriaId) {
      pizzeriasQuery = pizzeriasQuery.eq("id", targetPizzeriaId)
    }
    const { data: pizzerias, error: pizError } = await pizzeriasQuery
    if (pizError || !pizzerias || pizzerias.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma pizzaria encontrada para processar", details: pizError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const results = []

    for (const piz of pizzerias) {
      // 1. Busca ai_settings para obter stock_alert_lead_hours
      const { data: aiSettings } = await supabase
        .from("ai_settings")
        .select("stock_alert_lead_hours")
        .eq("pizzeria_id", piz.id)
        .maybeSingle()

      const leadHours = aiSettings?.stock_alert_lead_hours || 24

      // 2. Busca insumos monitorados
      const { data: items, error: itemsError } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("pizzeria_id", piz.id)

      if (itemsError || !items || items.length === 0) {
        results.push({
          pizzeria_id: piz.id,
          pizzeria_name: piz.name,
          status: "sem insumos cadastrados",
          alerts_generated: 0
        })
        continue
      }

      // 3. Busca volume de pedidos das últimas 72 horas para calcular taxa de consumo
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 3600 * 1000).toISOString()
      const { count: recentOrderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("pizzeria_id", piz.id)
        .gte("received_at", seventyTwoHoursAgo)
        .neq("status", "canceled")

      // Média de pedidos por hora (se for uma pizzaria nova sem pedidos, assume base razoável de 3.5 pedidos/hora)
      const ordersPerHour = Math.max((recentOrderCount || 0) / 72, 3.0)

      let alertsCreated = 0
      const analyzedProjections = []

      for (const item of items as InventoryItem[]) {
        // Coeficiente estimado de consumo por pedido baseado no tipo de insumo
        let consumptionPerOrder = 0.25 // default 250g ou 0.25 unidades
        const lowerName = item.name.toLowerCase()

        if (lowerName.includes("mussarela") || lowerName.includes("queijo") || lowerName.includes("catupiry")) {
          consumptionPerOrder = 0.35 // 350g por pizza/pedido
        } else if (lowerName.includes("farinha") || lowerName.includes("massa")) {
          consumptionPerOrder = 0.25 // 250g
        } else if (lowerName.includes("molho") || lowerName.includes("tomate")) {
          consumptionPerOrder = 0.15 // 150ml
        } else if (lowerName.includes("calabresa") || lowerName.includes("bacon") || lowerName.includes("frango")) {
          consumptionPerOrder = 0.20 // 200g
        } else if (lowerName.includes("caixa") || lowerName.includes("embalagem")) {
          consumptionPerOrder = 1.10 // ~1.1 caixas por pedido
        } else if (lowerName.includes("refrigerante") || lowerName.includes("bebida")) {
          consumptionPerOrder = 0.60
        }

        const hourlyConsumption = ordersPerHour * consumptionPerOrder
        const currentQty = Number(item.current_quantity) || 0
        const minThreshold = Number(item.min_threshold) || 0

        // Horas estimadas até atingir o estoque mínimo
        const qtyUntilMin = Math.max(0, currentQty - minThreshold)
        const hoursUntilMin = hourlyConsumption > 0 ? qtyUntilMin / hourlyConsumption : 999

        // Horas até zerar completamente
        const hoursUntilZero = hourlyConsumption > 0 ? currentQty / hourlyConsumption : 999

        // Data prevista para esgotamento
        const depletionDate = new Date(Date.now() + Math.round(hoursUntilZero * 3600 * 1000)).toISOString()

        // Determina se deve gerar alerta preventivo com base em stock_alert_lead_hours
        const shouldAlert = hoursUntilMin <= leadHours || currentQty <= minThreshold

        if (shouldAlert) {
          // Severidade: critical se já estiver abaixo do mínimo ou se esgotar em menos de 6 horas
          const isCritical = currentQty <= minThreshold || hoursUntilZero <= 6
          const severity = isCritical ? "critical" : "warning"

          // Verifica se já existe um alerta ativo (não resolvido) para este insumo
          const { data: existingAlert } = await supabase
            .from("inventory_alerts")
            .select("id, severity")
            .eq("pizzeria_id", piz.id)
            .eq("inventory_item_id", item.id)
            .eq("resolved", false)
            .maybeSingle()

          if (!existingAlert) {
            // Cria novo alerta preventivo
            await supabase.from("inventory_alerts").insert({
              pizzeria_id: piz.id,
              inventory_item_id: item.id,
              predicted_depletion_at: depletionDate,
              severity: severity,
              resolved: false
            })
            alertsCreated++
          } else if (existingAlert.severity !== severity) {
            // Atualiza severidade se agravou
            await supabase
              .from("inventory_alerts")
              .update({ severity: severity, predicted_depletion_at: depletionDate })
              .eq("id", existingAlert.id)
          }
        }

        analyzedProjections.push({
          item_id: item.id,
          name: item.name,
          current_quantity: currentQty,
          min_threshold: minThreshold,
          hourly_consumption: Number(hourlyConsumption.toFixed(2)),
          hours_until_min: Number(hoursUntilMin.toFixed(1)),
          hours_until_zero: Number(hoursUntilZero.toFixed(1)),
          predicted_depletion_at: depletionDate,
          alert_triggered: shouldAlert
        })
      }

      results.push({
        pizzeria_id: piz.id,
        pizzeria_name: piz.name,
        lead_hours_used: leadHours,
        items_analyzed: items.length,
        alerts_generated: alertsCreated,
        projections: analyzedProjections
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Previsão de estoque e cálculo de depleção concluídos com sucesso",
        timestamp: new Date().toISOString(),
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno ao prever estoque" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
