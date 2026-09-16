# DOCUMENTO 07 — docs/FUNCTIONS.md
# Functions — PizzaHub

## Edge Functions (Deno, kebab-case)
1. **ifood-webhook**: recebe eventos oficiais do iFood e atualiza orders, order_items e delivery_reviews.
2. **poll-delivery-orders**: busca pedidos via polling nas APIs de delivery onde não houver webhook.
3. **sync-order-status**: reflete a mudança de status do PizzaHub de volta na API do app de delivery.
4. **push-order-to-pdv**: envia pedido confirmado ao PDV existente (API direta, webhook ou ponte).
5. **whatsapp-webhook**: recebe mensagens via Evolution API e despacha para a IA ou atendente humano.
6. **ai-agent-reply**: orquestra atendimento no WhatsApp com Claude Haiku, cardápio e montagem de pedido.
7. **own-site-order**: recebe pedidos do carrinho do site próprio (/loja) sem login.
8. **analyze-reviews**: analisa sentimento e extrai tópicos de avaliações dos deliveries.
9. **forecast-inventory**: calcula previsão de consumo e gera alertas preventivos de estoque.
10. **generate-daily-report**: consolida faturamento, ticket médio e cancelados do dia com insights da IA.
11. **generate-weekly-report**: consolida desempenho dos últimos 7 dias com recomendações.

## Postgres Functions / RPCs / Triggers
* **current_pizzeria_id()**: retorna o pizzeria_id do usuário logado para RLS.
* **confirm_order(order_id uuid)**: aceita pedido em transação e despacha ao PDV.
* **advance_order_status(order_id uuid, to_status text)**: avança máquina de estados.
* **trg_order_status_history()**: trigger que grava histórico imutável a cada mudança de status.
