# DOCUMENTO 02 — docs/ESTRUTURA.md
# Estrutura técnica
Banco de dados completo, backend e páginas do sistema

Estrutura técnica completa do PizzaHub — central de comando para pizzarias que unifica pedidos de iFood, 99Food, Keeta, WhatsApp e site próprio em uma tela única, com IA integrada, sobre Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime + Cron).

Caminho de build escolhido: Claude Code + Supabase. Todo o back-end continua 100% Supabase.

---

## 1. Modelo de dados
Nomenclatura definida aqui é reusada LITERALMENTE em todo o pacote. Tabelas/colunas em snake_case.

### pizzerias
Propósito: representa a pizzaria (tenant) e suas configurações globais de operação.
* id uuid PK default gen_random_uuid()
* name text NOT NULL
* cnpj text NOT NULL
* timezone text NOT NULL default 'America/Sao_Paulo'
* pdv_integration_type text — ex.: 'direct_api', 'file_bridge', 'webhook'
* pdv_config jsonb — credenciais/endpoint do PDV existente
* created_at timestamptz NOT NULL default now()
* Índices: idx_pizzerias_cnpj (cnpj)

### profiles
Propósito: espelha auth.users e guarda papel e vínculo do funcionário com a pizzaria.
* id uuid PK (FK -> auth.users.id)
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* full_name text NOT NULL
* role text NOT NULL default 'attendant' — enum lógico: 'owner_manager', 'attendant', 'kitchen'
* active boolean NOT NULL default true
* created_at timestamptz NOT NULL default now()
* Índices: idx_profiles_pizzeria_id (pizzeria_id), idx_profiles_role (pizzeria_id, role)

### sales_channels
Propósito: cadastra cada canal de venda (iFood, 99Food, Keeta, WhatsApp, site próprio) e o estado da integração.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* channel_type text NOT NULL — 'ifood', '99food', 'keeta', 'whatsapp', 'own_site'
* display_name text NOT NULL
* is_active boolean NOT NULL default true
* credentials jsonb — tokens/merchant_id da API oficial (referência a secret)
* integration_status text NOT NULL default 'disconnected' — 'connected', 'error', 'disconnected'
* last_sync_at timestamptz
* Índices: idx_sales_channels_pizzeria_id (pizzeria_id), idx_sales_channels_type (pizzeria_id, channel_type)

### menu_categories
Propósito: categorias do cardápio próprio (Pizzas, Bebidas, Sobremesas) — valem para WhatsApp e site.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* name text NOT NULL
* sort_order int NOT NULL default 0
* Índices: idx_menu_categories_pizzeria_id (pizzeria_id, sort_order)

### menu_items
Propósito: produtos do cardápio próprio com preço e disponibilidade.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* category_id uuid FK -> menu_categories.id NOT NULL
* name text NOT NULL
* description text
* base_price numeric(10,2) NOT NULL
* image_url text — Supabase Storage
* is_available boolean NOT NULL default true
* created_at timestamptz NOT NULL default now()
* Índices: idx_menu_items_pizzeria_id (pizzeria_id), idx_menu_items_category_id (category_id), idx_menu_items_available (pizzeria_id, is_available)

### menu_item_options
Propósito: adicionais/tamanhos/bordas de um item (ex.: borda recheada, tamanho grande).
* id uuid PK default gen_random_uuid()
* menu_item_id uuid FK -> menu_items.id NOT NULL
* option_group text NOT NULL — ex.: 'size', 'border', 'extra'
* name text NOT NULL
* price_delta numeric(10,2) NOT NULL default 0
* Índices: idx_menu_item_options_item_id (menu_item_id)

### customers
Propósito: clientes finais dos canais próprios (WhatsApp/site) — nunca acessam o painel.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* name text
* phone text — usado como chave no WhatsApp
* default_address jsonb
* created_at timestamptz NOT NULL default now()
* Índices: idx_customers_pizzeria_id (pizzeria_id), idx_customers_phone (pizzeria_id, phone)

### orders
Propósito: coração do sistema — todo pedido de qualquer canal, na tela unificada e no histórico.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* channel_id uuid FK -> sales_channels.id NOT NULL
* customer_id uuid FK -> customers.id (null para deliveries que não expõem cliente)
* external_order_id text — id do pedido no iFood/99Food/Keeta
* channel_type text NOT NULL — desnormalizado p/ filtro rápido na tela unificada
* status text NOT NULL default 'new' — 'new', 'confirmed', 'in_preparation', 'ready', 'out_for_delivery', 'delivered', 'canceled'
* is_active boolean NOT NULL default true — false quando vai p/ histórico
* total_amount numeric(10,2) NOT NULL default 0
* delivery_type text — 'delivery', 'pickup'
* delivery_address jsonb
* payment_method text
* customer_notes text — ex.: "sem cebola"
* pdv_synced_at timestamptz — quando foi enviado ao PDV
* received_at timestamptz NOT NULL default now()
* delivered_at timestamptz
* Índices: idx_orders_pizzeria_active (pizzeria_id, is_active, received_at DESC), idx_orders_channel_id (channel_id), idx_orders_status (pizzeria_id, status), idx_orders_external (channel_id, external_order_id), idx_orders_received_at (pizzeria_id, received_at)

### order_items
Propósito: itens de cada pedido, com opções e observações para a cozinha.
* id uuid PK default gen_random_uuid()
* order_id uuid FK -> orders.id NOT NULL
* menu_item_id uuid FK -> menu_items.id (null quando vem de delivery externo sem match)
* item_name text NOT NULL — snapshot do nome
* quantity int NOT NULL default 1
* unit_price numeric(10,2) NOT NULL
* selected_options jsonb — bordas/tamanhos/adicionais escolhidos
* item_notes text
* Índices: idx_order_items_order_id (order_id), idx_order_items_menu_item_id (menu_item_id)

### order_status_history
Propósito: trilha de cada mudança de status (para auditoria e sincronização com o app de origem).
* id uuid PK default gen_random_uuid()
* order_id uuid FK -> orders.id NOT NULL
* from_status text
* to_status text NOT NULL
* changed_by uuid FK -> profiles.id (null se automático)
* synced_to_channel boolean NOT NULL default false
* created_at timestamptz NOT NULL default now()
* Índices: idx_order_status_history_order_id (order_id, created_at)

### whatsapp_conversations
Propósito: conversas do canal próprio no WhatsApp, com estado de atendimento (IA x humano).
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* customer_id uuid FK -> customers.id
* customer_phone text NOT NULL
* handled_by text NOT NULL default 'ai' — 'ai', 'human'
* assigned_to uuid FK -> profiles.id
* needs_human boolean NOT NULL default false
* last_message_at timestamptz NOT NULL default now()
* Índices: idx_wa_conv_pizzeria (pizzeria_id, last_message_at DESC), idx_wa_conv_phone (pizzeria_id, customer_phone), idx_wa_conv_needs_human (pizzeria_id, needs_human)

### whatsapp_messages
Propósito: mensagens individuais de cada conversa (IA e cliente).
* id uuid PK default gen_random_uuid()
* conversation_id uuid FK -> whatsapp_conversations.id NOT NULL
* direction text NOT NULL — 'inbound', 'outbound'
* sender text NOT NULL — 'customer', 'ai', 'attendant'
* content text NOT NULL
* created_at timestamptz NOT NULL default now()
* Índices: idx_wa_messages_conversation (conversation_id, created_at)

### inventory_items
Propósito: insumos monitorados para previsão de estoque pela IA.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* name text NOT NULL — ex.: "Mussarela"
* unit text NOT NULL — 'kg', 'un', 'l'
* current_quantity numeric(10,2) NOT NULL default 0
* min_threshold numeric(10,2) NOT NULL default 0
* updated_at timestamptz NOT NULL default now()
* Índices: idx_inventory_pizzeria (pizzeria_id)

### inventory_alerts
Propósito: alertas de reposição gerados pela previsão da IA antes do insumo zerar.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* inventory_item_id uuid FK -> inventory_items.id NOT NULL
* predicted_depletion_at timestamptz
* severity text NOT NULL default 'warning' — 'warning', 'critical'
* resolved boolean NOT NULL default false
* created_at timestamptz NOT NULL default now()
* Índices: idx_inventory_alerts_pizzeria (pizzeria_id, resolved, created_at DESC)

### delivery_reviews
Propósito: avaliações recebidas nos apps de delivery, para análise da IA.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* channel_id uuid FK -> sales_channels.id NOT NULL
* external_review_id text
* rating numeric(2,1)
* comment text
* ai_sentiment text — 'positive', 'neutral', 'negative'
* ai_topics jsonb — pontos recorrentes extraídos pela IA
* reviewed_at timestamptz NOT NULL default now()
* Índices: idx_reviews_pizzeria (pizzeria_id, reviewed_at DESC), idx_reviews_channel (channel_id), idx_reviews_sentiment (pizzeria_id, ai_sentiment)

### reports
Propósito: relatórios diário/semanal consolidados com insights da IA.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* report_type text NOT NULL — 'daily', 'weekly'
* period_start date NOT NULL
* period_end date NOT NULL
* metrics jsonb NOT NULL — faturamento por canal, ticket médio, itens mais vendidos, cancelados
* ai_insights text — tendências, picos, sugestões
* generated_at timestamptz NOT NULL default now()
* Índices: idx_reports_pizzeria_type (pizzeria_id, report_type, period_start DESC)

### ai_settings
Propósito: configuração do comportamento da IA definida pelo gerente.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL UNIQUE
* whatsapp_tone text NOT NULL default 'amigável'
* suggestion_enabled boolean NOT NULL default true
* suggested_item_ids jsonb — itens que a IA prioriza sugerir
* stock_alert_lead_hours int NOT NULL default 24
* updated_at timestamptz NOT NULL default now()
* Índices: idx_ai_settings_pizzeria (pizzeria_id)

### operating_hours
Propósito: horários de funcionamento e regras por canal próprio.
* id uuid PK default gen_random_uuid()
* pizzeria_id uuid FK -> pizzerias.id NOT NULL
* weekday int NOT NULL — 0-6
* open_time time
* close_time time
* avg_prep_minutes int NOT NULL default 30
* delivery_fee numeric(10,2) NOT NULL default 0
* Índices: idx_operating_hours_pizzeria (pizzeria_id, weekday)

---

## 2. RLS e autenticação
Autenticação: Supabase Auth por email + senha para a equipe interna (gerentes, atendentes, funcionários) — não há cadastro público, contas são criadas pelo Dono/Gerente. Clientes finais não têm login — interagem só por WhatsApp/site, cujas escritas passam por Edge Functions com service_role. Papel do usuário lido de profiles.role; helper current_pizzeria_id() (RPC) retorna a pizzaria do usuário logado para isolar tenants. RLS habilitado em TODAS as tabelas.

---

## 3. Functions/endpoints

### Edge Functions (Deno, kebab-case)
1. ifood-webhook
2. poll-delivery-orders
3. sync-order-status
4. push-order-to-pdv
5. whatsapp-webhook
6. ai-agent-reply
7. own-site-order
8. analyze-reviews
9. forecast-inventory
10. generate-daily-report
11. generate-weekly-report

### Postgres RPCs / triggers
* current_pizzeria_id() — retorna pizzeria_id do usuário logado (usada em todas as políticas RLS).
* confirm_order(order_id) — transação: muda status para confirmed, grava order_status_history, dispara push-order-to-pdv e sync-order-status.
* advance_order_status(order_id, to_status) — valida transição, grava histórico, marca is_active=false e delivered_at quando delivered.
* trg_order_status_history — trigger que registra automaticamente cada mudança de orders.status.

---

## 4. Páginas do frontend
* /login — autenticação da equipe interna (email + senha). Sem cadastro público.
* /unified-orders — tela unificada (página central): todos os pedidos novos/em preparo/em rota, marcados por canal de origem, com alerta em tempo real (Realtime).
* /order/:id — detalhe do pedido: itens, opções, observações do cliente, endereço, sincronização com PDV e app de origem.
* /kitchen-queue — fila de produção para a cozinha: pedidos confirmados em ordem de chegada/prioridade, com botão "marcar pronto".
* /menu-management — gestão do cardápio próprio (categorias, itens, opções, preços, disponibilidade).
* /whatsapp-inbox — caixa de conversas do WhatsApp: atendimentos da IA e intervenção humana.
* /inventory — insumos monitorados e alertas de estoque previstos pela IA.
* /delivery-reviews — avaliações dos apps de delivery com sentimento e tópicos.
* /reports-daily — relatório diário: faturamento por canal, ticket médio, cancelados.
* /reports-weekly — relatório semanal com insights da IA.
* /settings-channels — conexão/estado das integrações e credenciais.
* /settings-ai — configuração do comportamento da IA.
* /settings-hours — horários de funcionamento, taxas e tempo de preparo.
* /settings-team — gestão de usuários e papéis (só Dono/Gerente).
* /loja — site próprio do cliente final (página pública, cardápio + carrinho sem login).
