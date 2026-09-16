import { supabase } from '@/lib/supabase'

export interface WhatsAppConversation {
  id: string
  pizzeria_id: string
  customer_id?: string
  customer_name: string
  customer_phone: string
  handled_by: 'ai' | 'human'
  needs_human: boolean
  last_message_at: string
  last_message_text: string
  unread_count: number
}

export interface WhatsAppMessage {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  sender: 'customer' | 'ai' | 'attendant'
  content: string
  created_at: string
}

const initialConversations: WhatsAppConversation[] = [
  {
    id: 'conv-001',
    pizzeria_id: 'piz-123',
    customer_id: 'cust-1',
    customer_name: 'Renata Vasconcelos',
    customer_phone: '(11) 98123-4567',
    handled_by: 'human',
    needs_human: true,
    last_message_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    last_message_text: 'Gostaria de falar com um atendente por favor, quero trocar o endereço de entrega!',
    unread_count: 2
  },
  {
    id: 'conv-002',
    pizzeria_id: 'piz-123',
    customer_id: 'cust-2',
    customer_name: 'Felipe Santana',
    customer_phone: '(11) 97654-3210',
    handled_by: 'ai',
    needs_human: false,
    last_message_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    last_message_text: 'Perfeito! Gostaria de adicionar a Borda Vulcão de Catupiry sim.',
    unread_count: 0
  },
  {
    id: 'conv-003',
    pizzeria_id: 'piz-123',
    customer_id: 'cust-3',
    customer_name: 'Camila Rossi',
    customer_phone: '(11) 99888-7766',
    handled_by: 'ai',
    needs_human: false,
    last_message_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    last_message_text: 'Pedido confirmado! Seu pedido WA-2041 já foi enviado para a cozinha.',
    unread_count: 0
  }
]

const initialMessages: Record<string, WhatsAppMessage[]> = {
  'conv-001': [
    {
      id: 'msg-1',
      conversation_id: 'conv-001',
      direction: 'inbound',
      sender: 'customer',
      content: 'Boa noite! Fiz um pedido agora há pouco mas informei o número do prédio errado.',
      created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-001',
      direction: 'outbound',
      sender: 'ai',
      content: 'Olá, Renata! Sou a assistente virtual da pizzaria. Poderia me confirmar o número do seu pedido?',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-3',
      conversation_id: 'conv-001',
      direction: 'inbound',
      sender: 'customer',
      content: 'Gostaria de falar com um atendente por favor, quero trocar o endereço de entrega!',
      created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString()
    }
  ],
  'conv-002': [
    {
      id: 'msg-4',
      conversation_id: 'conv-002',
      direction: 'inbound',
      sender: 'customer',
      content: 'Olá! Qual o valor da Pizza Calabresa Grande?',
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-5',
      conversation_id: 'conv-002',
      direction: 'outbound',
      sender: 'ai',
      content: 'Olá, Felipe! 🍕 Nossa Pizza Calabresa Artesanal Grande está R$ 64,90! Vai com calabresa fininha, cebola roxa e orégano.',
      created_at: new Date(Date.now() - 19 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-6',
      conversation_id: 'conv-002',
      direction: 'outbound',
      sender: 'ai',
      content: 'Dica do chefe: que tal colocar uma Borda Vulcão de Catupiry Original (+R$ 14,00) para ficar ainda mais saborosa? 😋',
      created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-7',
      conversation_id: 'conv-002',
      direction: 'inbound',
      sender: 'customer',
      content: 'Perfeito! Gostaria de adicionar a Borda Vulcão de Catupiry sim.',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    }
  ],
  'conv-003': [
    {
      id: 'msg-8',
      conversation_id: 'conv-003',
      direction: 'inbound',
      sender: 'customer',
      content: 'Quero uma Margherita e uma Coca Zero 2L para entrega na Alameda Santos 450 apto 32, vou pagar no PIX.',
      created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-9',
      conversation_id: 'conv-003',
      direction: 'outbound',
      sender: 'ai',
      content: 'Excelente pedido, Camila! 🍕 1x Margherita (R$ 68,00) + 1x Coca Zero 2L (R$ 14,00) + Entrega (R$ 8,00). Total: R$ 90,00.',
      created_at: new Date(Date.now() - 48 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-10',
      conversation_id: 'conv-003',
      direction: 'outbound',
      sender: 'ai',
      content: 'Pedido confirmado! Seu pedido WA-2041 já foi enviado para a cozinha.',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  ]
}

class WhatsAppStore {
  private conversations: WhatsAppConversation[] = []
  private messages: Record<string, WhatsAppMessage[]> = {}
  private listeners: Set<() => void> = new Set()

  constructor() {
    const savedConvs = localStorage.getItem('pizzahub_wa_conversations')
    const savedMsgs = localStorage.getItem('pizzahub_wa_messages')

    if (savedConvs && savedMsgs) {
      try {
        this.conversations = JSON.parse(savedConvs)
        this.messages = JSON.parse(savedMsgs)
      } catch (e) {
        this.conversations = initialConversations
        this.messages = initialMessages
      }
    } else {
      this.conversations = initialConversations
      this.messages = initialMessages
      this.save()
    }
  }

  private save() {
    localStorage.setItem('pizzahub_wa_conversations', JSON.stringify(this.conversations))
    localStorage.setItem('pizzahub_wa_messages', JSON.stringify(this.messages))
    this.notify()
  }

  private notify() {
    this.listeners.forEach((fn) => fn())
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  public getConversations(): WhatsAppConversation[] {
    return [...this.conversations].sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    )
  }

  public getConversationById(id: string): WhatsAppConversation | undefined {
    return this.conversations.find((c) => c.id === id)
  }

  public getMessages(conversationId: string): WhatsAppMessage[] {
    return this.messages[conversationId] || []
  }

  // Assumir conversa pelo atendente humano
  public async takeoverConversation(conversationId: string, attendantName: string): Promise<void> {
    const conv = this.conversations.find((c) => c.id === conversationId)
    if (conv) {
      conv.handled_by = 'human'
      conv.needs_human = false
      conv.unread_count = 0

      // Grava aviso no chat
      const systemNotice: WhatsAppMessage = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        conversation_id: conversationId,
        direction: 'outbound',
        sender: 'attendant',
        content: `Olá! Sou ${attendantName}, atendente da pizzaria. Estou assumindo seu atendimento para te ajudar!`,
        created_at: new Date().toISOString()
      }

      if (!this.messages[conversationId]) this.messages[conversationId] = []
      this.messages[conversationId].push(systemNotice)
      conv.last_message_at = new Date().toISOString()
      conv.last_message_text = systemNotice.content

      try {
        await supabase
          .from('whatsapp_conversations')
          .update({ handled_by: 'human', needs_human: false })
          .eq('id', conversationId)
      } catch (e) {}

      this.save()
    }
  }

  // Devolver conversa para o controle da IA
  public async returnToAi(conversationId: string): Promise<void> {
    const conv = this.conversations.find((c) => c.id === conversationId)
    if (conv) {
      conv.handled_by = 'ai'
      conv.needs_human = false

      const systemNotice: WhatsAppMessage = {
        id: 'msg-' + Math.random().toString(36).substring(2, 9),
        conversation_id: conversationId,
        direction: 'outbound',
        sender: 'ai',
        content: 'Atendimento retornado para a assistente virtual de IA. Como posso te ajudar?',
        created_at: new Date().toISOString()
      }

      if (!this.messages[conversationId]) this.messages[conversationId] = []
      this.messages[conversationId].push(systemNotice)
      conv.last_message_at = new Date().toISOString()
      conv.last_message_text = systemNotice.content

      try {
        await supabase
          .from('whatsapp_conversations')
          .update({ handled_by: 'ai', needs_human: false })
          .eq('id', conversationId)
      } catch (e) {}

      this.save()
    }
  }

  // Envio manual de mensagem pelo atendente
  public async sendMessage(
    conversationId: string,
    content: string,
    sender: 'attendant' | 'customer' = 'attendant'
  ): Promise<WhatsAppMessage> {
    const newMsg: WhatsAppMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      conversation_id: conversationId,
      direction: sender === 'customer' ? 'inbound' : 'outbound',
      sender: sender,
      content: content.trim(),
      created_at: new Date().toISOString()
    }

    if (!this.messages[conversationId]) {
      this.messages[conversationId] = []
    }
    this.messages[conversationId].push(newMsg)

    const conv = this.conversations.find((c) => c.id === conversationId)
    if (conv) {
      conv.last_message_at = newMsg.created_at
      conv.last_message_text = newMsg.content
      if (sender === 'customer' && conv.handled_by === 'human') {
        conv.unread_count += 1
      }
    }

    try {
      await supabase.from('whatsapp_messages').insert(newMsg)
    } catch (e) {}

    this.save()
    return newMsg
  }

  // Simulação de mensagem recebida de cliente com auto-resposta de IA se couber
  public async simulateIncomingCustomerMessage(conversationId: string, text: string): Promise<void> {
    await this.sendMessage(conversationId, text, 'customer')

    const conv = this.conversations.find((c) => c.id === conversationId)
    if (!conv) return

    const lower = text.toLowerCase()
    const isEscalation =
      lower.includes('humano') ||
      lower.includes('atendente') ||
      lower.includes('reclama') ||
      lower.includes('cancelar') ||
      lower.includes('problema')

    if (isEscalation) {
      conv.needs_human = true
      conv.handled_by = 'human'
      this.save()
      return
    }

    // Se a IA estiver no controle, simula resposta automática
    if (conv.handled_by === 'ai') {
      setTimeout(() => {
        let aiReply = 'Entendido! Já estou preparando todas as informações para você. Deseja adicionar alguma borda ou refrigerante ao seu pedido?'
        if (lower.includes('cardapio') || lower.includes('cardápio') || lower.includes('sabores')) {
          aiReply = 'Nossas pizzas mais famosas são Calabresa Especial, Margherita e Quatro Queijos! Posso montar seu pedido?'
        }
        this.sendMessage(conversationId, aiReply, 'ai' as any)
      }, 1000)
    }
  }

  public resetToDefault() {
    this.conversations = initialConversations
    this.messages = initialMessages
    this.save()
  }
}

export const whatsappService = new WhatsAppStore()
