# SKILL.md — PizzaHub

Guia operacional para a IA de desenvolvimento (Claude Code) construir o PizzaHub: a central de comando que unifica pedidos de iFood, 99Food, Keeta, WhatsApp e site próprio numa única tela, com IA integrada, sobre Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime + Cron) e sincronizado com o PDV existente da pizzaria.

Este documento não ensina boas práticas genéricas — ele estabelece as regras deste projeto. Sempre que houver conflito entre seu instinto e um documento do pacote, o documento vence.

---

## Convenções

### Nomenclatura (obrigatória e sem exceção):
* **Banco de dados**: inglês, snake_case. Tabelas no plural (pizzerias, sales_channels, orders). Colunas em snake_case (created_at, pizzeria_id). Todas as tabelas usam id uuid, created_at/updated_at com trigger automático.
* **Edge Functions**: kebab-case, invocadas via HTTPS (ex.: ifood-webhook, poll-delivery-orders, whatsapp-webhook, ai-agent-reply, own-site-order).
* **Postgres Functions / RPCs / triggers**: snake_case (ex.: current_pizzeria_id(), confirm_order, advance_order_status).
* **Rotas do frontend**: kebab-case (ex.: /login, /unified-orders, /kitchen-queue, /menu-management, /whatsapp-inbox, /inventory, /delivery-reviews, /reports-daily, /reports-weekly, /settings-channels, /settings-ai, /settings-hours, /settings-team, /loja).
* Os nomes já foram fixados em docs/ESTRUTURA.md e docs/DEPARA.md. Não crie sinônimos. orders é sempre orders, nunca pedidos no banco.

### Stack (não negociável):
* **Backend = Supabase, sempre**: PostgreSQL com RLS, Supabase Auth (email + senha para a equipe interna), Storage, Edge Functions (Deno) para toda lógica server-side/webhooks/integrações externas, Realtime para a tela unificada, e pg_cron para automações recorrentes (polling de delivery, relatórios diários/semanais). Nunca Firebase, MongoDB, PlanetScale ou qualquer outro banco.
* **Segredos**: tokens iFood, chaves de IA, credenciais WhatsApp ficam no Supabase Vault. Edge Functions usam service_role de forma controlada.
* **Caminho de build**: Claude Code + Supabase, conforme definido em docs/ESTRUTURA.md e docs/PLANO.md. O usuário já tem um sistema de PDV próprio criado e quer automatizá-lo junto — ou seja, existe capacidade técnica interna para manter código, e o projeto exige integração customizada (APIs oficiais do iFood, sincronização bidirecional com o PDV, IA em todo o fluxo). Frontend em React + TypeScript + TailwindCSS sobre Supabase.

---

## Ordem de implementação recomendada

Siga a ordem Fundação -> Construção -> Polimento de docs/PLANO.md. Não pule etapas nem antecipe funcionalidades da fase seguinte.

### 1. Fundação — banco e acesso
* Aplicar db/schemas.sql na íntegra: pizzerias, profiles, sales_channels, orders e demais tabelas.
* Habilitar RLS em cada tabela e implementar current_pizzeria_id() para isolamento por tenant.
* Configurar Supabase Auth (email + senha) e o vínculo profiles -> auth.users com os três papéis: owner_manager, attendant, kitchen.
* Subir o esqueleto do painel (layout, navegação, guarda de rotas por papel).

### 2. Construção — funcionalidades reais
* Tela unificada de pedidos (/unified-orders) com Supabase Realtime exibindo iFood, 99Food, Keeta, WhatsApp e site numa fila só, com status em tempo real.
* Integrações de delivery via Edge Functions: ifood-webhook, poll-delivery-orders. Começar pelo iFood (usuário confirmou CNPJ ativo e acesso à API oficial).
* Canais próprios: site público /loja (own-site-order) e WhatsApp (whatsapp-webhook).
* IA integrada (ai-agent-reply e demais funções de IA): resposta no WhatsApp, insights de vendas, análise de avaliações.
* Sincronização com o PDV existente e relatórios diário/semanal (via pg_cron).

### 3. Polimento
* Estados vazio/erro/loading em todas as páginas, responsividade, automações recorrentes finas e ajustes de performance.

---

## Como usar cada documento durante o desenvolvimento

* docs/PRD.md — Consulte ao começar qualquer módulo, para entender o porquê e o contexto de negócio (operação 100% interna, dor das múltiplas telas/tablets, dependência de comissões). Use para não implementar nada voltado ao cliente final dentro do painel — clientes só tocam /loja e WhatsApp.
* docs/PRS.md — Fonte dos requisitos técnicos testáveis (RS-xx). Antes de dar uma tarefa como pronta, encontre o RS correspondente e valide contra ele. Ex.: RS-01 exige autenticação exclusivamente por Supabase Auth email+senha.
* db/schemas.sql — Única fonte da verdade do modelo de dados. Consulte antes de tocar em qualquer coisa que envolva persistência. Não crie tabela/coluna que não esteja aqui sem antes atualizar este arquivo.
* docs/PLANO.md — Consulte para saber em que ordem construir e em que fase você está. Não avance de fase sem concluir a anterior.
* docs/FUNCTIONS.md — Releia a seção da function antes de escrever qualquer Edge Function ou RPC. Contém contratos, convenções de Vault/service_role, e o comportamento esperado de ifood-webhook, poll-delivery-orders, whatsapp-webhook, ai-agent-reply, own-site-order, relatórios etc.
* docs/PAGINAS.md — Releia a seção da página antes de codar cada tela. Define rotas, papéis com acesso, e os estados obrigatórios (carregando/vazio/erro).
* docs/DEPARA.md — Consulte antes de criar qualquer tabela, function ou página nova, para não duplicar algo que já existe e para conferir que os nomes batem entre banco -> backend -> frontend. Se algo não aparece aqui, provavelmente não deveria existir ainda.

---

## Gates de qualidade

Antes de considerar uma etapa concluída, verifique:
* [ ] RLS habilitado em toda tabela nova, com isolamento por tenant via current_pizzeria_id(). Nenhuma tabela sai sem policy.
* [ ] Nomenclatura confere com docs/DEPARA.md (tabela snake_case, function kebab-case, rota kebab-case) — sem sinônimos.
* [ ] A tabela/coluna usada existe em db/schemas.sql (ou o schema foi atualizado formalmente antes).
* [ ] Existe RS correspondente em docs/PRS.md cumprido e testado.
* [ ] Toda página tem os três estados (carregando, vazio, erro) conforme docs/PAGINAS.md.
* [ ] Controle de acesso por papel (owner_manager / attendant / kitchen) aplicado na rota e nas policies — atendente não vê o que é só de gerente.
* [ ] Edge Functions usam segredos do Vault, nunca chaves hardcoded; service_role só onde justificado.
* [ ] A regra de negócio descrita no PRD/PROCESSO foi de fato aplicada (ex.: pedido de qualquer canal cai na fila unificada em tempo real via Realtime).
* [ ] Automação recorrente usa pg_cron (polling de delivery, relatório diário/semanal), não solução externa.

---

## O que NÃO fazer

* Não trocar o backend. Nada de Firebase, MongoDB, Supabase-alternativas. O backend é Supabase, ponto.
* Não inventar tabela, coluna, function ou rota fora de db/schemas.sql / docs/FUNCTIONS.md / docs/DEPARA.md. Se precisar de algo novo, atualize o documento primeiro.
* Não pular RLS "por enquanto". Toda tabela nasce com RLS e policy de tenant. Nunca deixar tabela aberta.
* Não misturar os papéis definidos (owner_manager, attendant, kitchen). Cliente final nunca acessa o painel interno — só /loja e WhatsApp.
* Não construir app/checkout para o cliente final dentro do painel — o usuário deixou claro que o sistema é operado só por gerentes, atendentes e funcionários; os canais de venda direta são o site /loja e o WhatsApp.
* Não usar N8N nem Zapier. Automação é Make (no-code simples) ou Edge Functions + pg_cron. Neste projeto, prefira Edge Functions + Cron por já haver time técnico.
* Não colocar tokens/segredos no código (iFood, chaves de IA, WhatsApp) — sempre Supabase Vault.
* Não ignorar o PDV existente. Toda a lógica de pedidos deve considerar a sincronização com o PDV que a pizzaria já opera; não recriar um PDV do zero.
* Não implementar integração de delivery sem seguir o contrato de docs/FUNCTIONS.md. Comece pelo iFood (API oficial + CNPJ confirmados); 99Food e Keeta seguem o mesmo padrão de poll-delivery-orders/webhook.
* Não avançar de fase do docs/PLANO.md com pendências da fase anterior (ex.: mexer em IA antes da tela unificada estar funcionando com Realtime).
