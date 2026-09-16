const fs = require('fs');
const path = require('path');

function write(relPath, content) {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log('Created:', relPath);
}

// 6. docs/PRD.md
write('docs/PRD.md', `# DOCUMENTO 03 — docs/PRD.md
# PRD — Product Requirements Document

## 1. Contexto
Pizzarias que vendem em múltiplos apps de delivery (iFood, 99Food, Keeta) hoje operam com vários tablets e telas abertas ao mesmo tempo, cada uma com sua própria fila de pedidos e regras de status. Esse cenário gera erro de digitação, pedido perdido, demora no aceite e dependência total das plataformas de delivery, que cobram comissões altas. O PizzaHub nasce para unificar todos esses canais em uma única tela, adicionar canais de venda próprios (WhatsApp e site) e injetar IA em todo o fluxo operacional. O sistema é operado exclusivamente pela equipe interna (gerentes, atendentes e cozinha) e se conecta ao PDV que a pizzaria já possui, automatizando o processo de ponta a ponta.

## 2. Problema
Fragmentação de canais em múltiplos tablets, redigitação manual de pedidos para o PDV gerando erros e lentidão, dependência exclusiva de comissões altas dos apps de delivery e ausência de inteligência artificial para atendimento no WhatsApp, previsão de estoque e análise de relatórios.

## 3. Objetivos
1. Unificar 100% dos canais de pedido (iFood, 99Food, Keeta, WhatsApp e site próprio) em uma única tela com atualização em tempo real.
2. Automatizar o envio de pedidos confirmados ao PDV existente.
3. Reduzir a dependência do iFood ativando canais próprios (WhatsApp + site).
4. Operacionalizar IA completa em cinco frentes (atendimento WhatsApp, sugestão de itens, previsão de estoque, análise de avaliações e relatórios).
5. Entregar visibilidade gerencial com relatório diário e semanal.

## 4. Personas
* **Ricardo — Dono/Gerente da pizzaria**: comanda toda a operação de um lugar só.
* **Júlia — Atendente**: aceita e avança pedidos de todos os canais de uma tela só.
* **Marcos — Funcionário de cozinha**: vê fila em ordem clara com observações e marca prontos.
* **Aurora — Assistente de IA**: atende no WhatsApp, sugere itens e analisa dados.
* **Sr. Antônio — Cliente final**: pede pelo WhatsApp ou site sem complicação.

## 5. Requisitos funcionais principais (RF-01 a RF-29)
* RF-01: Login para gerente/atendente/cozinha com resumo do dia.
* RF-02: Configuração de cardápio próprio (produtos, adicionais, tamanhos, bordas).
* RF-03: Horários de funcionamento, taxas e tempo de preparo por canal.
* RF-04: Ajuste de comportamento da IA (tom, sugestões, alerta de estoque).
* RF-05: Gestão de equipe e papéis.
* RF-09 a RF-15: Tela unificada de pedidos em tempo real, confirmação e avanço de status com envio ao PDV.
* RF-16 e RF-17: Fila de produção para cozinha.
* RF-18 a RF-24: Atendimento de WhatsApp por IA com sugestões e escalonamento para humano.
* RF-25 e RF-26: Site próprio do cliente final (/loja).
* RF-27 a RF-29: Integrações com deliveries e identificação clara de canal.
`);

// 7. docs/PRS.md
write('docs/PRS.md', `# DOCUMENTO 04 — docs/PRS.md
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
`);

// 8. docs/FUNCTIONS.md
write('docs/FUNCTIONS.md', `# DOCUMENTO 07 — docs/FUNCTIONS.md
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
`);

// 9. docs/PAGINAS.md
write('docs/PAGINAS.md', `# DOCUMENTO 08 — docs/PAGINAS.md
# Páginas do frontend — PizzaHub

* **/login**: autenticação da equipe interna (email + senha).
* **/unified-orders**: tela unificada em tempo real com colunas Novos -> Em preparo -> Prontos -> Em rota.
* **/order/:id**: detalhe completo do pedido, itens, endereço e sincronização de PDV/delivery.
* **/kitchen-queue**: fila de produção para cozinha com modo tela cheia e botão marcar pronto.
* **/menu-management**: gestão de cardápio próprio (categorias, itens, bordas, adicionais).
* **/whatsapp-inbox**: central de conversas do WhatsApp com atendimentos da IA e intervenção humana.
* **/inventory**: controle de insumos e alertas preventivos de estoque da IA.
* **/delivery-reviews**: avaliações de iFood/outros com análise de sentimento e tópicos.
* **/reports-daily**: relatório diário de faturamento, ticket médio e cancelados.
* **/reports-weekly**: relatório semanal com gráficos de pico e insights da IA.
* **/settings-channels**: status e credenciais de canais (iFood, 99Food, Keeta, WhatsApp, site).
* **/settings-ai**: tom de atendimento da IA, itens prioritários e alerta de estoque.
* **/settings-hours**: horários de funcionamento, taxas e tempo de preparo.
* **/settings-team**: cadastro e gestão de funcionários (gerente, atendente, cozinha).
* **/loja**: site público do cliente final (cardápio + carrinho sem login).
`);

// 10. docs/DEPARA.md
write('docs/DEPARA.md', `# DOCUMENTO 09 — docs/DEPARA.md
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
`);

console.log('Docs part 2 generated.');
