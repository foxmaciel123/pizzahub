# DOCUMENTO 09 — docs/DEPARA.md
# DE-PARA — Matriz de rastreabilidade

| Tabela | Functions/Endpoints que a tocam | Páginas que a usam |
| :--- | :--- | :--- |
| pizzerias | current_pizzeria_id, ifood-webhook, poll-delivery-orders, own-site-order, ai-agent-reply | /settings-channels, /settings-hours, /settings-team, /settings-ai |
| profiles | current_pizzeria_id, confirm_order, advance_order_status | /login, /settings-team, /whatsapp-inbox |
| sales_channels | ifood-webhook, poll-delivery-orders, sync-order-status | /settings-channels, /unified-orders, /delivery-reviews |
| menu_categories | ai-agent-reply, own-site-order | /menu-management, /loja |
| menu_items | ai-agent-reply, own-site-order, forecast-inventory | /menu-management, /loja, /order/:id |
| menu_item_options | ai-agent-reply, own-site-order | /menu-management, /loja |
| customers | whatsapp-webhook, ai-agent-reply, own-site-order | /whatsapp-inbox, /order/:id |
| orders | ifood-webhook, poll-delivery-orders, sync-order-status, push-order-to-pdv, ai-agent-reply, own-site-order, confirm_order, advance_order_status | /unified-orders, /order/:id, /kitchen-queue, /reports-daily, /reports-weekly |
| order_items | ifood-webhook, poll-delivery-orders, ai-agent-reply, own-site-order, confirm_order | /order/:id, /kitchen-queue |
| order_status_history | sync-order-status, confirm_order, advance_order_status, trg_order_status_history | /order/:id |
| whatsapp_conversations | whatsapp-webhook, ai-agent-reply | /whatsapp-inbox |
| whatsapp_messages | whatsapp-webhook, ai-agent-reply | /whatsapp-inbox |
| inventory_items | forecast-inventory | /inventory |
| inventory_alerts | forecast-inventory | /inventory |
| delivery_reviews | ifood-webhook, analyze-reviews | /delivery-reviews, /reports-weekly |
| reports | generate-daily-report, generate-weekly-report | /reports-daily, /reports-weekly |
| ai_settings | ai-agent-reply, forecast-inventory | /settings-ai |
| operating_hours | own-site-order, ai-agent-reply | /settings-hours, /loja |
