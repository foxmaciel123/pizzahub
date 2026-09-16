# DOCUMENTO 06 — docs/PLANO.md
# Plano de desenvolvimento — PizzaHub

## Fase 1 — Fundação
Entregável: projeto no ar com banco completo, login da equipe e o esqueleto do painel interno navegável (sem funcionalidades ainda), pronto para receber as features.

Tabelas: todas do db/schemas.sql (pizzerias, profiles, sales_channels, menu_categories, menu_items, menu_item_options, customers, orders, order_items, order_status_history, whatsapp_conversations, whatsapp_messages, inventory_items, inventory_alerts, delivery_reviews, reports, ai_settings, operating_hours).
Páginas: /login, layout base do painel com navegação para todas as rotas internas.
Functions/RPCs: current_pizzeria_id(), trg_order_status_history.

Checklist:
- [ ] Criar o projeto PizzaHub no Claude Code com Supabase conectado
- [ ] Rodar db/schemas.sql no Supabase (todas as tabelas + índices)
- [ ] Habilitar RLS em todas as tabelas e criar current_pizzeria_id() + políticas por papel
- [ ] Configurar Supabase Auth (email + senha) e criar /login sem cadastro público
- [ ] Montar o layout base do painel com menu lateral para todas as rotas e proteção de acesso por papel

---

## Fase 2 — Construção
Entregável: todas as funcionalidades reais do PizzaHub funcionando — tela unificada em tempo real, ingestão de pedidos do iFood, envio ao PDV, gestão de cardápio, WhatsApp/site com IA, estoque, avaliações e relatórios.

Checklist:
- [ ] Construir a tela unificada /unified-orders + /order/:id + /kitchen-queue com Realtime e fluxo de status
- [ ] Integrar iFood (ifood-webhook + poll-delivery-orders) e sincronizar status de volta (sync-order-status)
- [ ] Conectar o PDV existente (push-order-to-pdv) e a gestão de cardápio (/menu-management)
- [ ] Ativar o canal WhatsApp com IA (whatsapp-webhook, ai-agent-reply, /whatsapp-inbox) e o site próprio (/loja + own-site-order)
- [ ] Implementar estoque e avaliações com IA (/inventory, forecast-inventory, /delivery-reviews, analyze-reviews)
- [ ] Gerar relatórios diário/semanal (generate-daily-report, generate-weekly-report) e telas de configuração (/settings-*)

---

## Fase 3 — Polimento e lançamento
Entregável: sistema robusto e pronto para o dia a dia — tratamento de estados vazios/erro/carregamento, responsividade em tablet, automações agendadas ativas e deploy em produção.

Checklist:
- [ ] Adicionar estados de vazio, carregamento e erro em todas as páginas
- [ ] Garantir responsividade para uso em tablet no balcão e na cozinha
- [ ] Agendar os Cron Jobs (polling, previsão de estoque, análise de avaliações, relatórios diário/semanal)
- [ ] Testar o fluxo ponta a ponta e fazer deploy final
