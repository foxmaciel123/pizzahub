# DOCUMENTO 04 — docs/PRS.md
# PRS — PizzaHub (Product/System Requirements Specification)

## Requisitos de sistema (RS-01 a RS-25)
* RS-01: Autenticação interna exclusiva por Supabase Auth (email+senha); sem cadastro público.
* RS-02: Gestão de usuários restrita a owner_manager da mesma pizzeria_id.
* RS-03: Tela /unified-orders lista pedidos com is_active=true da pizzeria_id ordenados por received_at desc.
* RS-04: Supabase Realtime propaga novos pedidos e mudanças de status em <= 2s para /unified-orders e /kitchen-queue.
* RS-05: ifood-webhook valida assinatura/origem antes de gravar pedidos.
* RS-06: Recebimento de pedidos só para sales_channels com integration_status='connected'.
* RS-07: poll-delivery-orders idempotente por (channel_id, external_order_id).
* RS-08: RPC confirm_order altera status para confirmed, grava histórico e dispara envio ao PDV e sincronização externa.
* RS-09: RPC advance_order_status valida transições permitidas e finaliza pedidos entregues (is_active=false, delivered_at=now()).
* RS-10: Papel kitchen restrito às transições confirmed -> in_preparation -> ready.
* RS-11: push-order-to-pdv envia pedido ao PDV conforme pdv_integration_type/pdv_config.
* RS-12: sync-order-status sincroniza status de volta ao app de delivery de origem.
* RS-13: whatsapp-webhook associa mensagem à conversa por (pizzeria_id, customer_phone).
* RS-14: ai-agent-reply responde com cardápio próprio e grava em whatsapp_messages.
* RS-15: Reclamações/exceções no WhatsApp ativam needs_human=true e handled_by='human'.
* RS-16: IA oferece sugestões complementares se suggestion_enabled=true.
* RS-17: own-site-order valida preços no servidor e cria pedido de canal próprio.
* RS-18: Canais próprios respeitam operating_hours.
* RS-19: analyze-reviews classifica avaliações em sentimentos e tópicos.
* RS-20: forecast-inventory gera inventory_alerts com base em projeção de consumo.
* RS-21 e RS-22: generate-daily-report e generate-weekly-report consolidam métricas e insights.
* RS-23: order_status_history é imutável via trigger trg_order_status_history.
* RS-24: Isolamento multi-tenant por current_pizzeria_id() em todas as tabelas.
* RS-25: Segredos armazenados exclusivamente no Supabase Vault.
