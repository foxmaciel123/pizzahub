# DOCUMENTO 03 — docs/PRD.md
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
