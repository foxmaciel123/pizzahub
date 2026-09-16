# PizzaHub — README

## Sobre o projeto

O PizzaHub é a central de comando para pizzarias que unifica, em uma única tela em tempo real, os pedidos vindos de iFood, 99Food, Keeta, WhatsApp e do site próprio da pizzaria, com IA integrada em todo o fluxo operacional (sugestão de itens, atendimento automático no WhatsApp, análise de avaliações e geração de relatórios com insights). Construído sobre Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime + Cron), o PizzaHub é operado exclusivamente pela equipe interna — donos/gerentes, atendentes e cozinha — e se conecta ao PDV que a pizzaria já possui para automatizar o repasse de pedidos, além de oferecer relatórios diário e semanal. Os clientes finais nunca acessam o painel interno: interagem apenas pelo site público (/loja) e pelo WhatsApp.

## Antes de tudo

LEIA O `SKILL.md` ANTES DE ESCREVER QUALQUER LINHA DE CÓDIGO OU CRIAR QUALQUER TABELA.

O SKILL.md é o guia operacional específico de como construir o PizzaHub: convenções de nomenclatura, ordem de execução (Fundação -> Construção -> Polimento), regras de RLS/multi-tenant, tratamento de segredos no Supabase Vault e o passo a passo de integração com iFood/99Food/Keeta, WhatsApp, site próprio e o PDV existente. Nenhum arquivo deste pacote deve ser implementado sem antes ler o `SKILL.md`. Ele é o primeiro documento que a IDE (Claude Code) precisa carregar no contexto.

## Mapa de arquivos

| Arquivo | O que contém | Quando consultar |
| :--- | :--- | :--- |
| **SKILL.md** | Guia operacional mestre: convenções, regras de negócio e ordem de trabalho. | Sempre primeiro, antes de qualquer código ou tabela. |
| **docs/PROCESSO.md** | O fluxo de negócio da pizzaria: ciclo do pedido em cada canal, produção e conciliação. | Para entender o "porquê" antes de modelar telas/funções. |
| **docs/ESTRUTURA.md** | Fonte canônica de nomes: tabelas, Edge Functions, RPCs e rotas do frontend. | Sempre que criar/nomear qualquer artefato. |
| **docs/PRD.md** | Documento de produto: contexto, objetivos, personas e escopo do PizzaHub. | No início, para alinhar visão e escopo. |
| **docs/PRS.md** | Requisitos de sistema técnicos e testáveis (RS-01…): auth, tela unificada, IA, PDV. | Ao implementar e validar cada funcionalidade. |
| **db/schemas.sql** | Modelo de dados completo com RLS e isolamento por tenant. | Ao configurar o banco Supabase — rode este SQL primeiro. |
| **docs/PLANO.md** | Plano de desenvolvimento em fases (Fundação -> Construção -> Polimento). | Para saber a ordem exata de construir cada parte. |
| **docs/FUNCTIONS.md** | Todas as Edge Functions (Deno) e Postgres Functions (RPC/triggers/cron). | Ao construir a lógica server-side e integrações. |
| **docs/PAGINAS.md** | Cada tela do frontend, rotas, papéis de acesso e estados (carregando/vazio/erro). | Ao construir o frontend (painel interno e /loja). |
| **docs/DEPARA.md** | Matriz de rastreabilidade Tabela -> Functions/Endpoints -> Páginas. | Para conferir que nada ficou órfão. |
