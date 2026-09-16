-- ====================================================================
-- PizzaHub — Schemas do Banco de Dados PostgreSQL (Supabase)
-- Modelagem de Dados Completa: 18 Tabelas, Índices, RLS e RPCs
-- Conforme docs/ESTRUTURA.md (Seção 1 e Seção 2)
-- ====================================================================

-- 1. Extensões
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ====================================================================
-- 2. TABELAS (18 TABELAS DO MODELO DE DADOS)
-- ====================================================================

-- 2.1 pizzerias (Tenant raiz)
create table if not exists public.pizzerias (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text not null,
  timezone text not null default 'America/Sao_Paulo',
  pdv_integration_type text default 'direct_api',
  pdv_config jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_pizzerias_cnpj on public.pizzerias (cnpj);

-- 2.2 profiles (Espelha auth.users e vincula funcionário à pizzaria)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  full_name text not null,
  role text not null default 'attendant' check (role in ('owner_manager', 'attendant', 'kitchen')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_pizzeria_id on public.profiles(pizzeria_id);
create index if not exists idx_profiles_role on public.profiles(pizzeria_id, role);

-- 2.3 sales_channels (Canais de venda e integrações)
create table if not exists public.sales_channels (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  channel_type text not null check (channel_type in ('ifood', '99food', 'keeta', 'whatsapp', 'own_site')),
  display_name text not null,
  is_active boolean not null default true,
  credentials jsonb default '{}'::jsonb,
  integration_status text not null default 'disconnected' check (integration_status in ('connected', 'error', 'disconnected')),
  last_sync_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_sales_channels_pizzeria_id on public.sales_channels(pizzeria_id);
create index if not exists idx_sales_channels_type on public.sales_channels(pizzeria_id, channel_type);

-- 2.4 menu_categories (Categorias do cardápio próprio)
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);
create index if not exists idx_menu_categories_pizzeria_id on public.menu_categories(pizzeria_id, sort_order);

-- 2.5 menu_items (Produtos do cardápio próprio)
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(10,2) not null,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_menu_items_pizzeria_id on public.menu_items(pizzeria_id);
create index if not exists idx_menu_items_category_id on public.menu_items(category_id);
create index if not exists idx_menu_items_available on public.menu_items(pizzeria_id, is_available);

-- 2.6 menu_item_options (Adicionais, tamanhos e bordas)
create table if not exists public.menu_item_options (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  option_group text not null,
  name text not null,
  price_delta numeric(10,2) not null default 0
);
create index if not exists idx_menu_item_options_item_id on public.menu_item_options(menu_item_id);

-- 2.7 customers (Clientes finais de canais próprios)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  name text,
  phone text not null,
  default_address jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_customers_pizzeria_id on public.customers(pizzeria_id);
create index if not exists idx_customers_phone on public.customers(pizzeria_id, phone);

-- 2.8 orders (Pedidos de todos os canais)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  channel_id uuid not null references public.sales_channels(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  external_order_id text,
  channel_type text not null,
  status text not null default 'new' check (status in ('new', 'confirmed', 'in_preparation', 'ready', 'out_for_delivery', 'delivered', 'canceled')),
  is_active boolean not null default true,
  total_amount numeric(10,2) not null default 0,
  delivery_type text check (delivery_type in ('delivery', 'pickup')),
  delivery_address jsonb default '{}'::jsonb,
  payment_method text,
  customer_notes text,
  pdv_synced_at timestamptz,
  received_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists idx_orders_pizzeria_active on public.orders(pizzeria_id, is_active, received_at desc);
create index if not exists idx_orders_channel_id on public.orders(channel_id);
create index if not exists idx_orders_status on public.orders(pizzeria_id, status);
create index if not exists idx_orders_external on public.orders(channel_id, external_order_id);
create index if not exists idx_orders_received_at on public.orders(pizzeria_id, received_at);

-- 2.9 order_items (Itens de cada pedido)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null,
  selected_options jsonb default '[]'::jsonb,
  item_notes text
);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_menu_item_id on public.order_items(menu_item_id);

-- 2.10 order_status_history (Trilha de auditoria imutável)
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  synced_to_channel boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_order_status_history_order_id on public.order_status_history(order_id, created_at);

-- 2.11 whatsapp_conversations (Conversas de WhatsApp)
create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_phone text not null,
  handled_by text not null default 'ai' check (handled_by in ('ai', 'human')),
  assigned_to uuid references public.profiles(id) on delete set null,
  needs_human boolean not null default false,
  last_message_at timestamptz not null default now()
);
create index if not exists idx_wa_conv_pizzeria on public.whatsapp_conversations(pizzeria_id, last_message_at desc);
create index if not exists idx_wa_conv_phone on public.whatsapp_conversations(pizzeria_id, customer_phone);
create index if not exists idx_wa_conv_needs_human on public.whatsapp_conversations(pizzeria_id, needs_human);

-- 2.12 whatsapp_messages (Mensagens individuais)
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender text not null check (sender in ('customer', 'ai', 'attendant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_wa_messages_conversation on public.whatsapp_messages(conversation_id, created_at);

-- 2.13 inventory_items (Insumos monitorados para previsão)
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('kg', 'un', 'l')),
  current_quantity numeric(10,2) not null default 0,
  min_threshold numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists idx_inventory_pizzeria on public.inventory_items(pizzeria_id);

-- 2.14 inventory_alerts (Alertas preventivos de reposição)
create table if not exists public.inventory_alerts (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  predicted_depletion_at timestamptz,
  severity text not null default 'warning' check (severity in ('warning', 'critical')),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_inventory_alerts_pizzeria on public.inventory_alerts(pizzeria_id, resolved, created_at desc);

-- 2.15 delivery_reviews (Avaliações de delivery para IA)
create table if not exists public.delivery_reviews (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  channel_id uuid not null references public.sales_channels(id) on delete cascade,
  external_review_id text,
  rating numeric(2,1),
  comment text,
  ai_sentiment text check (ai_sentiment in ('positive', 'neutral', 'negative')),
  ai_topics jsonb default '[]'::jsonb,
  reviewed_at timestamptz not null default now()
);
create index if not exists idx_reviews_pizzeria on public.delivery_reviews(pizzeria_id, reviewed_at desc);
create index if not exists idx_reviews_channel on public.delivery_reviews(channel_id);
create index if not exists idx_reviews_sentiment on public.delivery_reviews(pizzeria_id, ai_sentiment);

-- 2.16 reports (Relatórios diário e semanal consolidados)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  report_type text not null check (report_type in ('daily', 'weekly')),
  period_start date not null,
  period_end date not null,
  metrics jsonb not null default '{}'::jsonb,
  ai_insights text,
  generated_at timestamptz not null default now()
);
create index if not exists idx_reports_pizzeria_type on public.reports(pizzeria_id, report_type, period_start desc);

-- 2.17 ai_settings (Configuração da IA por pizzaria)
create table if not exists public.ai_settings (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade unique,
  whatsapp_tone text not null default 'amigável',
  suggestion_enabled boolean not null default true,
  suggested_item_ids jsonb default '[]'::jsonb,
  stock_alert_lead_hours int not null default 24,
  updated_at timestamptz not null default now()
);
create index if not exists idx_ai_settings_pizzeria on public.ai_settings(pizzeria_id);

-- 2.18 operating_hours (Horários de funcionamento por canal próprio)
create table if not exists public.operating_hours (
  id uuid primary key default gen_random_uuid(),
  pizzeria_id uuid not null references public.pizzerias(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  open_time time,
  close_time time,
  avg_prep_minutes int not null default 30,
  delivery_fee numeric(10,2) not null default 0
);
create index if not exists idx_operating_hours_pizzeria on public.operating_hours(pizzeria_id, weekday);

-- ====================================================================
-- 3. FUNÇÕES AUXILIARES / RPCs DE MULTI-TENANT E PAPÉIS
-- ====================================================================

-- 3.1 current_pizzeria_id(): helper SECURITY DEFINER que retorna a pizzaria do usuário logado
create or replace function public.current_pizzeria_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select pizzeria_id from public.profiles where id = auth.uid() limit 1;
$$;

-- 3.2 current_user_role(): helper que retorna o papel interno do usuário autenticado
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- 3.3 trg_order_status_history_fn(): trigger automático de auditoria imutável
create or replace function public.trg_order_status_history_fn()
returns trigger
language plpgsql
security definer
as $$
begin
  if (old.status is distinct from new.status) then
    insert into public.order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by,
      synced_to_channel,
      created_at
    ) values (
      new.id,
      old.status,
      new.status,
      auth.uid(),
      false,
      now()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_status_history on public.orders;
create trigger trg_order_status_history
  after update of status on public.orders
  for each row execute function public.trg_order_status_history_fn();

-- 3.4 RPC: confirm_order
create or replace function public.confirm_order(order_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_role text;
begin
  select * into v_order from public.orders
  where id = order_id and pizzeria_id = public.current_pizzeria_id();

  if not found then
    raise exception 'Pedido não encontrado ou acesso negado.';
  end if;

  v_role := public.current_user_role();
  if v_role not in ('owner_manager', 'attendant') then
    raise exception 'Apenas atendentes e gerentes podem aceitar pedidos.';
  end if;

  if v_order.status != 'new' then
    raise exception 'Apenas pedidos novos podem ser aceitos.';
  end if;

  update public.orders
  set status = 'confirmed'
  where id = order_id;

  return jsonb_build_object('success', true, 'status', 'confirmed');
end;
$$;

-- 3.5 RPC: advance_order_status
create or replace function public.advance_order_status(order_id uuid, to_status text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_order record;
  v_role text;
begin
  select * into v_order from public.orders
  where id = order_id and pizzeria_id = public.current_pizzeria_id();

  if not found then
    raise exception 'Pedido não encontrado ou acesso negado.';
  end if;

  v_role := public.current_user_role();

  -- Cozinha restrita exclusivamente às transições confirmed -> in_preparation -> ready
  if v_role = 'kitchen' then
    if to_status not in ('in_preparation', 'ready') then
      raise exception 'Papel de cozinha restrito às transições de preparo (em preparo ou pronto).';
    end if;
    if to_status = 'in_preparation' and v_order.status != 'confirmed' then
      raise exception 'Pedido precisa estar confirmado para entrar em preparo.';
    end if;
    if to_status = 'ready' and v_order.status != 'in_preparation' then
      raise exception 'Pedido precisa estar em preparo para ser marcado como pronto.';
    end if;
  end if;

  update public.orders
  set status = to_status,
      is_active = (to_status != 'delivered' and to_status != 'canceled'),
      delivered_at = case when to_status = 'delivered' then now() else delivered_at end
  where id = order_id;

  return jsonb_build_object('success', true, 'status', to_status);
end;
$$;

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS) EM TODAS AS 18 TABELAS
-- ====================================================================

alter table public.pizzerias enable row level security;
alter table public.profiles enable row level security;
alter table public.sales_channels enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_options enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_alerts enable row level security;
alter table public.delivery_reviews enable row level security;
alter table public.reports enable row level security;
alter table public.ai_settings enable row level security;
alter table public.operating_hours enable row level security;

-- 4.1 pizzerias: SELECT por qualquer profile da pizzaria; escrita só owner_manager
create policy pizzerias_select on public.pizzerias
  for select using (id = public.current_pizzeria_id());

create policy pizzerias_modify on public.pizzerias
  for all using (id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager')
  with check (id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.2 profiles: SELECT próprio usuário ou owner_manager; gestão de equipe só owner_manager; update próprio nome
create policy profiles_select on public.profiles
  for select using (pizzeria_id = public.current_pizzeria_id() and (id = auth.uid() or public.current_user_role() = 'owner_manager'));

create policy profiles_insert on public.profiles
  for insert with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

create policy profiles_update on public.profiles
  for update using (
    pizzeria_id = public.current_pizzeria_id() and (public.current_user_role() = 'owner_manager' or id = auth.uid())
  )
  with check (
    pizzeria_id = public.current_pizzeria_id() and (public.current_user_role() = 'owner_manager' or id = auth.uid())
  );

create policy profiles_delete on public.profiles
  for delete using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.3 sales_channels: SELECT equipe; escrita só owner_manager
create policy sales_channels_select on public.sales_channels
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy sales_channels_modify on public.sales_channels
  for all using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager')
  with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.4 ai_settings: SELECT equipe; escrita só owner_manager
create policy ai_settings_select on public.ai_settings
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy ai_settings_modify on public.ai_settings
  for all using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager')
  with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.5 operating_hours: SELECT equipe; escrita só owner_manager
create policy operating_hours_select on public.operating_hours
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy operating_hours_modify on public.operating_hours
  for all using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager')
  with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.6 menu_categories: SELECT equipe (leitura pública é servida via Edge Function); escrita só owner_manager
create policy menu_categories_select on public.menu_categories
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy menu_categories_modify on public.menu_categories
  for all using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager')
  with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.7 menu_items: SELECT equipe; escrita só owner_manager
create policy menu_items_select on public.menu_items
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy menu_items_modify on public.menu_items
  for all using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager')
  with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.8 menu_item_options: SELECT equipe; escrita só owner_manager
create policy menu_item_options_select on public.menu_item_options
  for select using (exists (
    select 1 from public.menu_items m where m.id = menu_item_options.menu_item_id and m.pizzeria_id = public.current_pizzeria_id()
  ));

create policy menu_item_options_modify on public.menu_item_options
  for all using (exists (
    select 1 from public.menu_items m where m.id = menu_item_options.menu_item_id and m.pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager'
  ))
  with check (exists (
    select 1 from public.menu_items m where m.id = menu_item_options.menu_item_id and m.pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager'
  ));

-- 4.9 orders: SELECT por toda equipe; INSERT manual por atendente/gerente; UPDATE por atendente/kitchen; DELETE bloqueado
create policy orders_select on public.orders
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy orders_insert on public.orders
  for insert with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() in ('owner_manager', 'attendant'));

create policy orders_update on public.orders
  for update using (
    pizzeria_id = public.current_pizzeria_id() and (
      public.current_user_role() in ('owner_manager', 'attendant') or
      (public.current_user_role() = 'kitchen' and status in ('confirmed', 'in_preparation'))
    )
  )
  with check (
    pizzeria_id = public.current_pizzeria_id() and (
      public.current_user_role() in ('owner_manager', 'attendant') or
      (public.current_user_role() = 'kitchen' and status in ('in_preparation', 'ready'))
    )
  );

-- 4.10 order_items: SELECT equipe; INSERT atendente/gerente; UPDATE/DELETE atendente/gerente
create policy order_items_select on public.order_items
  for select using (exists (
    select 1 from public.orders o where o.id = order_items.order_id and o.pizzeria_id = public.current_pizzeria_id()
  ));

create policy order_items_insert on public.order_items
  for insert with check (exists (
    select 1 from public.orders o where o.id = order_items.order_id and o.pizzeria_id = public.current_pizzeria_id() and public.current_user_role() in ('owner_manager', 'attendant')
  ));

create policy order_items_modify on public.order_items
  for all using (exists (
    select 1 from public.orders o where o.id = order_items.order_id and o.pizzeria_id = public.current_pizzeria_id() and public.current_user_role() in ('owner_manager', 'attendant')
  ));

-- 4.11 order_status_history: SELECT equipe; UPDATE e DELETE bloqueados (trilha imutável)
create policy order_status_history_select on public.order_status_history
  for select using (exists (
    select 1 from public.orders o where o.id = order_status_history.order_id and o.pizzeria_id = public.current_pizzeria_id()
  ));

-- 4.12 whatsapp_conversations: SELECT equipe; UPDATE atendente quando assume conversa; DELETE bloqueado
create policy whatsapp_conversations_select on public.whatsapp_conversations
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy whatsapp_conversations_update on public.whatsapp_conversations
  for update using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() in ('owner_manager', 'attendant'));

-- 4.13 whatsapp_messages: SELECT equipe; INSERT por atendente humano; DELETE bloqueado
create policy whatsapp_messages_select on public.whatsapp_messages
  for select using (exists (
    select 1 from public.whatsapp_conversations w where w.id = whatsapp_messages.conversation_id and w.pizzeria_id = public.current_pizzeria_id()
  ));

create policy whatsapp_messages_insert on public.whatsapp_messages
  for insert with check (exists (
    select 1 from public.whatsapp_conversations w where w.id = whatsapp_messages.conversation_id and w.pizzeria_id = public.current_pizzeria_id() and public.current_user_role() in ('owner_manager', 'attendant')
  ));

-- 4.14 customers: SELECT equipe; INSERT/UPDATE atendente/gerente; DELETE só owner_manager
create policy customers_select on public.customers
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy customers_insert on public.customers
  for insert with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() in ('owner_manager', 'attendant'));

create policy customers_update on public.customers
  for update using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() in ('owner_manager', 'attendant'));

create policy customers_delete on public.customers
  for delete using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.15 inventory_items: SELECT equipe; escrita só owner_manager
create policy inventory_items_select on public.inventory_items
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy inventory_items_modify on public.inventory_items
  for all using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager')
  with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.16 inventory_alerts: SELECT equipe; UPDATE de resolução só owner_manager; DELETE bloqueado
create policy inventory_alerts_select on public.inventory_alerts
  for select using (pizzeria_id = public.current_pizzeria_id());

create policy inventory_alerts_update on public.inventory_alerts
  for update using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager')
  with check (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');

-- 4.17 delivery_reviews: SELECT equipe; escrita bloqueada para equipe (exclusiva de Edge Function via service_role)
create policy delivery_reviews_select on public.delivery_reviews
  for select using (pizzeria_id = public.current_pizzeria_id());

-- 4.18 reports: SELECT só owner_manager; escrita bloqueada para equipe (exclusiva de Cron via service_role)
create policy reports_select on public.reports
  for select using (pizzeria_id = public.current_pizzeria_id() and public.current_user_role() = 'owner_manager');
