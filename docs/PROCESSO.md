# DOCUMENTO 01 — docs/PROCESSO.md
# Processo do aplicativo
Como o aplicativo funciona, passo a passo, por papel de usuário

## 1. Visão geral
O PizzaHub é uma central de comando para pizzarias que unifica, em uma única tela, os pedidos que hoje chegam espalhados por iFood, 99Food, Keeta, WhatsApp e site próprio da pizzaria. Como você indicou que quer "um sistema completo e atualizado" onde os pedidos de todos os maiores deliveries do Brasil "apareçam todos em uma única tela unificada", o PizzaHub elimina o vai-e-vem entre vários tablets e apps de delivery, reduzindo erro de digitação, pedido perdido e demora no aceite. Além de centralizar os canais, o PizzaHub oferece um canal de venda próprio (WhatsApp + site da pizzaria) para você vender sem depender só do iFood — exatamente como você pediu ("seria ideal ter outro sistema além do iFood") — e conta com IA integrada e completa para atender clientes no WhatsApp, sugerir itens, prever estoque, analisar avaliações e gerar relatórios com insights. O sistema é operado exclusivamente pela equipe interna (gerentes, atendentes e funcionários) e conversa com o PDV que você já possui, automatizando o fluxo de ponta a ponta.

## 2. Papéis de usuário
* **Dono/Gerente**: acompanha a operação em tempo real, vê relatórios diários e semanais, configura cardápio, horários e regras, e recebe os insights da IA.
* **Atendente**: recebe, confirma, prepara e despacha os pedidos de todos os canais a partir da tela unificada.
* **Funcionário de cozinha/produção**: visualiza a fila de produção e marca os itens/pedidos como prontos.
* **Assistente de IA (agente automático)**: atende clientes no WhatsApp, sugere itens, monitora estoque e avaliações, e gera relatórios — sempre sob supervisão da equipe.
* **Cliente final (canal próprio)**: faz pedidos pelo WhatsApp ou site da pizzaria; nos apps de delivery ele continua comprando dentro do próprio iFood/99Food/Keeta, e o pedido chega ao PizzaHub automaticamente.

## 3. Processo passo a passo por papel

### Dono/Gerente
1. Faz login no PizzaHub e cai no painel geral, com os pedidos ativos de todos os canais e o resumo do dia.
2. Configura o cardápio uma única vez (produtos, preços, adicionais, tamanhos) que valerá para o WhatsApp e o site próprio.
3. Define horários de funcionamento, área de entrega, taxas e tempo médio de preparo por canal.
4. Ativa e ajusta o comportamento da IA: tom de atendimento no WhatsApp, quais itens sugerir e quando o alerta de estoque deve disparar.
5. Ao longo do dia, acompanha a tela unificada e vê onde há gargalo (canal mais movimentado, pedidos atrasados).
6. No fechamento, abre o relatório diário (faturamento por canal, ticket médio, itens mais vendidos, pedidos cancelados).
7. Semanalmente, abre o relatório semanal com os insights da IA: tendência de vendas, horários de pico, alertas de avaliações negativas nos deliveries e sugestões de reposição de estoque.

### Atendente
1. Faz login e visualiza a tela unificada com todos os pedidos novos, em preparo e em rota, identificados por canal de origem (iFood, 99Food, Keeta, WhatsApp, site).
2. Recebe um alerta em tempo real quando entra um pedido novo em qualquer canal.
3. Confere os itens e aceita/confirma o pedido — a confirmação é sincronizada de volta ao app de delivery de origem.
4. Ao confirmar, o pedido é enviado automaticamente ao PDV que você já usa e para a fila da cozinha.
5. Atualiza o status conforme avança (em preparo -> pronto -> saiu para entrega/retirada), mantendo o cliente e o app de delivery informados.
6. Nos pedidos do canal próprio (WhatsApp/site), assume a conversa quando a IA sinaliza que precisa de humano (ex.: pedido especial, reclamação).
7. Fecha o pedido quando entregue e ele sai da tela ativa, indo para o histórico.

### Funcionário de cozinha/produção
1. Acompanha a fila de produção com os pedidos confirmados, em ordem de chegada e prioridade.
2. Vê os itens de cada pedido com observações do cliente (sem cebola, borda recheada etc.).
3. Marca cada pedido como pronto ao concluir a produção.
4. A tela do atendente é atualizada automaticamente para o pedido seguir para entrega/retirada.

### Assistente de IA (agente automático)
1. Recebe mensagens de clientes no WhatsApp e responde com o cardápio, tira dúvidas e monta o pedido em linguagem natural.
2. Sugere itens durante a conversa (ex.: bebida, borda, sobremesa) para aumentar o ticket.
3. Registra o pedido do WhatsApp/site direto na tela unificada, junto com os pedidos dos deliveries.
4. Monitora o consumo e prevê estoque, alertando o gerente quando um insumo tende a acabar.
5. Analisa as avaliações recebidas nos apps de delivery e resume pontos positivos e reclamações recorrentes.
6. Gera relatórios diários e semanais com insights de vendas e recomendações.
7. Encaminha para um atendente humano sempre que a conversa fugir do padrão ou o cliente pedir.

### Cliente final (canal próprio)
1. Envia mensagem no WhatsApp da pizzaria ou acessa o site próprio.
2. Vê o cardápio, monta o pedido e recebe sugestões de complementos da IA.
3. Informa endereço/retirada e forma de pagamento.
4. Recebe a confirmação do pedido e o tempo estimado.
5. Recebe atualizações de status até a entrega.

## 4. Regras de negócio
* **Regra**: apenas gerentes, atendentes e funcionários da pizzaria acessam o sistema — clientes finais nunca acessam o painel interno, só interagem pelo WhatsApp/site.
* **Regra**: todo pedido confirmado é enviado automaticamente ao PDV existente da pizzaria, evitando redigitação.
* **Regra**: pedidos dos apps de delivery (iFood, 99Food, Keeta) só podem ser recebidos e sincronizados com CNPJ ativo e acesso às APIs oficiais habilitado.
* **Regra**: a mudança de status feita no PizzaHub reflete de volta no app de delivery de origem, mantendo cliente e plataforma sincronizados.
* **Regra**: cada pedido na tela unificada exibe claramente seu canal de origem para evitar confusão entre plataformas.
* **Regra**: a IA só finaliza sozinha pedidos dentro do padrão; conversas com reclamação, exceção ou pedido especial são escaladas para um atendente humano.
* **Regra**: o cardápio, preços e horários configurados valem para os canais próprios (WhatsApp e site); nos apps de delivery valem as regras da própria plataforma.
* **Regra**: pedidos entregues saem da tela ativa e passam para o histórico, alimentando os relatórios.
* **Regra**: relatório diário fecha no encerramento do expediente; relatório semanal consolida os sete dias com insights da IA.
* **Regra**: alertas de estoque são disparados com base na previsão da IA antes do insumo acabar, não só quando já zerou.

## 5. Suposições assumidas
* **SUPOSIÇÃO**: como o iFood tem APIs oficiais mais consolidadas e você confirmou acesso a elas, assumi que 99Food e Keeta serão integrados conforme a disponibilidade de suas APIs oficiais/parcerias no momento do build; onde não houver API oficial, os pedidos entram pelos canais próprios e demais integrações disponíveis.
* **SUPOSIÇÃO**: assumi que o "site próprio" é uma página de pedidos simples (cardápio + carrinho + envio ao painel), já que você mencionou o site mas não detalhou funcionalidades específicas dele.
* **SUPOSIÇÃO**: assumi que o pagamento nos canais próprios (WhatsApp/site) pode incluir opções como pagamento na entrega e/ou pagamento online, mas o meio exato não foi especificado por você.
* **SUPOSIÇÃO**: assumi que a "automação junto com o PDV" significa envio automático dos pedidos confirmados para o seu PDV; a forma de conexão depende do que o seu PDV atual permite (integração direta ou intermediária) e será validada no próximo passo.
* **SUPOSIÇÃO**: assumi que a impressão de comanda na cozinha é desejável, já que é comum em pizzaria, embora você não a tenha citado explicitamente.
