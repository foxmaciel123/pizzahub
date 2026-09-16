import { supabase } from '@/lib/supabase'
import { UserRole } from '@/contexts/AuthContext'

export type ChannelType = 'ifood' | '99food' | 'keeta' | 'whatsapp' | 'own_site'

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'in_preparation'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'canceled'

export interface OrderItemOption {
  name: string
  price: number
  group?: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id?: string
  item_name: string
  quantity: number
  unit_price: number
  selected_options: OrderItemOption[]
  item_notes?: string
}

export interface OrderStatusHistoryItem {
  id: string
  order_id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_by?: string
  changed_by_name?: string
  synced_to_channel: boolean
  created_at: string
}

export interface DeliveryAddress {
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  complement?: string
  reference?: string
}

export interface CustomerInfo {
  name: string
  phone: string
}

export interface Order {
  id: string
  pizzeria_id: string
  channel_id: string
  customer_id?: string
  external_order_id: string
  channel_type: ChannelType
  status: OrderStatus
  is_active: boolean
  total_amount: number
  delivery_type: 'delivery' | 'pickup'
  delivery_address: DeliveryAddress
  payment_method: string
  customer_notes?: string
  pdv_synced_at: string | null
  received_at: string
  delivered_at: string | null
  customer?: CustomerInfo
  items: OrderItem[]
  status_history: OrderStatusHistoryItem[]
}

// Armazenamento inicial simulado para permitir operação 100% interativa com fallback
const initialOrders: Order[] = [
  {
    id: 'ord-001',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-ifood',
    external_order_id: 'IF-8492',
    channel_type: 'ifood',
    status: 'new',
    is_active: true,
    total_amount: 94.80,
    delivery_type: 'delivery',
    delivery_address: {
      street: 'Av. Paulista',
      number: '1578',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      complement: 'Apt 42'
    },
    payment_method: 'Pago via iFood (PIX)',
    customer_notes: 'Favor caprichar no orégano e sem cebola!',
    pdv_synced_at: null,
    received_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    delivered_at: null,
    customer: {
      name: 'Gabriel Menezes',
      phone: '(11) 98765-4321'
    },
    items: [
      {
        id: 'item-1',
        order_id: 'ord-001',
        item_name: 'Pizza Calabresa Especial (Grande)',
        quantity: 1,
        unit_price: 68.90,
        selected_options: [
          { name: 'Borda Vulcão Catupiry', price: 14.00, group: 'Borda' },
          { name: 'Massa Tradicional Crocante', price: 0, group: 'Massa' }
        ],
        item_notes: 'Corte em 8 fatias'
      },
      {
        id: 'item-2',
        order_id: 'ord-001',
        item_name: 'Guaraná Antarctica 2L',
        quantity: 1,
        unit_price: 11.90,
        selected_options: []
      }
    ],
    status_history: [
      {
        id: 'hist-1',
        order_id: 'ord-001',
        from_status: null,
        to_status: 'new',
        changed_by_name: 'Sistema (Webhook iFood)',
        synced_to_channel: true,
        created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'ord-002',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-whatsapp',
    external_order_id: 'WA-2041',
    channel_type: 'whatsapp',
    status: 'confirmed',
    is_active: true,
    total_amount: 112.50,
    delivery_type: 'delivery',
    delivery_address: {
      street: 'Rua Augusta',
      number: '920',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      complement: 'Bloco B, 11'
    },
    payment_method: 'PIX Automático no WhatsApp',
    customer_notes: 'Interfone está com defeito, por favor chamar no portão.',
    pdv_synced_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    received_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    delivered_at: null,
    customer: {
      name: 'Mariana Duarte',
      phone: '(11) 97123-8899'
    },
    items: [
      {
        id: 'item-3',
        order_id: 'ord-002',
        item_name: '1/2 Margherita + 1/2 Quatro Queijos',
        quantity: 1,
        unit_price: 78.50,
        selected_options: [
          { name: 'Borda Recheada Cheddar', price: 12.00, group: 'Borda' }
        ],
        item_notes: 'Caprichar no manjericão fresco'
      },
      {
        id: 'item-4',
        order_id: 'ord-002',
        item_name: 'Pizza Doce Banana c/ Canela (Média)',
        quantity: 1,
        unit_price: 22.00,
        selected_options: []
      }
    ],
    status_history: [
      {
        id: 'hist-2',
        order_id: 'ord-002',
        from_status: null,
        to_status: 'new',
        changed_by_name: 'Assistente IA WhatsApp',
        synced_to_channel: true,
        created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-3',
        order_id: 'ord-002',
        from_status: 'new',
        to_status: 'confirmed',
        changed_by_name: 'Ricardo (Gerente)',
        synced_to_channel: true,
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'ord-003',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-site',
    external_order_id: 'SITE-552',
    channel_type: 'own_site',
    status: 'in_preparation',
    is_active: true,
    total_amount: 85.00,
    delivery_type: 'pickup',
    delivery_address: {},
    payment_method: 'Cartão de Crédito no Site',
    customer_notes: 'Retirada no balcão em 30 minutos.',
    pdv_synced_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    received_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    delivered_at: null,
    customer: {
      name: 'Lucas Ferreira',
      phone: '(11) 96543-2109'
    },
    items: [
      {
        id: 'item-5',
        order_id: 'ord-003',
        item_name: 'Pizza Frango com Catupiry (Grande)',
        quantity: 1,
        unit_price: 72.00,
        selected_options: [
          { name: 'Catupiry Original', price: 0, group: 'Recheio' }
        ]
      },
      {
        id: 'item-6',
        order_id: 'ord-003',
        item_name: 'Coca-Cola Zero 2L',
        quantity: 1,
        unit_price: 13.00,
        selected_options: []
      }
    ],
    status_history: [
      {
        id: 'hist-4',
        order_id: 'ord-003',
        from_status: null,
        to_status: 'new',
        changed_by_name: 'Site Próprio (/loja)',
        synced_to_channel: true,
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-5',
        order_id: 'ord-003',
        from_status: 'new',
        to_status: 'confirmed',
        changed_by_name: 'Júlia (Atendente)',
        synced_to_channel: true,
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      },
      {
        id: 'hist-6',
        order_id: 'ord-003',
        from_status: 'confirmed',
        to_status: 'in_preparation',
        changed_by_name: 'Marcos (Cozinha)',
        synced_to_channel: true,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'ord-004',
    pizzeria_id: 'piz-123',
    channel_id: 'chan-99food',
    external_order_id: '99F-3180',
    channel_type: '99food',
    status: 'ready',
    is_active: true,
    total_amount: 69.90,
    delivery_type: 'delivery',
    delivery_address: {
      street: 'Rua Bela Cintra',
      number: '430',
      neighborhood: 'Consolação',
      city: 'São Paulo'
    },
    payment_method: 'Pago no App 99Food',
    customer_notes: '',
    pdv_synced_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    received_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    delivered_at: null,
    customer: {
      name: 'Carolina Pires',
      phone: '(11) 95555-1234'
    },
    items: [
      {
        id: 'item-7',
        order_id: 'ord-004',
        item_name: 'Pizza Pepperoni Artesanal (Grande)',
        quantity: 1,
        unit_price: 69.90,
        selected_options: []
      }
    ],
    status_history: [
      {
        id: 'hist-7',
        order_id: 'ord-004',
        from_status: 'in_preparation',
        to_status: 'ready',
        changed_by_name: 'Marcos (Cozinha)',
        synced_to_channel: true,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    ]
  }
]

// Gestor de estado local para reatividade instantânea
class OrderStore {
  private orders: Order[] = []
  private listeners: Set<(orders: Order[]) => void> = new Set()

  constructor() {
    const saved = localStorage.getItem('pizzahub_orders_cache')
    if (saved) {
      try {
        this.orders = JSON.parse(saved)
      } catch (e) {
        this.orders = initialOrders
      }
    } else {
      this.orders = initialOrders
      this.save()
    }
  }

  private save() {
    localStorage.setItem('pizzahub_orders_cache', JSON.stringify(this.orders))
    this.notify()
  }

  private notify() {
    const copy = [...this.orders]
    this.listeners.forEach((fn) => fn(copy))
  }

  public subscribe(fn: (orders: Order[]) => void) {
    this.listeners.add(fn)
    fn([...this.orders])
    return () => {
      this.listeners.delete(fn)
    }
  }

  public getActiveOrders(): Order[] {
    return this.orders.filter((o) => o.is_active)
  }

  public getKitchenQueue(): Order[] {
    return this.orders.filter(
      (o) => o.is_active && (o.status === 'confirmed' || o.status === 'in_preparation')
    )
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id || o.external_order_id === id)
  }

  public async confirmOrder(orderId: string, role: UserRole, userName: string): Promise<Order> {
    if (role !== 'owner_manager' && role !== 'attendant') {
      throw new Error('Apenas atendentes e gerentes podem aceitar pedidos.')
    }

    const order = this.orders.find((o) => o.id === orderId)
    if (!order) throw new Error('Pedido não encontrado.')
    if (order.status !== 'new') throw new Error('Apenas pedidos novos podem ser aceitos.')

    // Tenta Supabase RPC e Edge Functions de envio ao PDV e sincronização externa
    try {
      await supabase.rpc('confirm_order', { order_id: orderId })
      await supabase.functions.invoke('push-order-to-pdv', { body: { order_id: orderId } })
      await supabase.functions.invoke('sync-order-status', { body: { order_id: orderId, to_status: 'confirmed' } })
    } catch (e) {
      console.warn('Supabase offline, operando envio ao PDV em modo reativo local:', e)
    }

    const previousStatus = order.status
    order.status = 'confirmed'
    order.pdv_synced_at = new Date().toISOString() // Simula push-to-pdv automático

    const historyEntry: OrderStatusHistoryItem = {
      id: 'hist-' + Math.random().toString(36).substring(2, 9),
      order_id: order.id,
      from_status: previousStatus,
      to_status: 'confirmed',
      changed_by_name: userName,
      synced_to_channel: true,
      created_at: new Date().toISOString()
    }

    order.status_history.push(historyEntry)
    this.save()
    return order
  }

  public async advanceOrderStatus(
    orderId: string,
    toStatus: OrderStatus,
    role: UserRole,
    userName: string
  ): Promise<Order> {
    const order = this.orders.find((o) => o.id === orderId)
    if (!order) throw new Error('Pedido não encontrado.')

    // Validação estrita por papel (mesma regra do PostgreSQL no schemas.sql)
    if (role === 'kitchen') {
      if (toStatus !== 'in_preparation' && toStatus !== 'ready') {
        throw new Error('Papel de cozinha restrito às transições de preparo (em preparo ou pronto).')
      }
      if (toStatus === 'in_preparation' && order.status !== 'confirmed') {
        throw new Error('Pedido precisa estar confirmado para entrar em preparo.')
      }
      if (toStatus === 'ready' && order.status !== 'in_preparation') {
        throw new Error('Pedido precisa estar em preparo para ser marcado como pronto.')
      }
    }

    // Tenta Supabase RPC se online
    try {
      await supabase.rpc('advance_order_status', {
        order_id: orderId,
        to_status: toStatus
      })
    } catch (e) {
      console.warn('RPC Supabase offline, operando via store local')
    }

    const previousStatus = order.status
    order.status = toStatus

    // Se entregue ou cancelado, deixa de ser ativo (sai da tela unificada)
    if (toStatus === 'delivered' || toStatus === 'canceled') {
      order.is_active = false
      if (toStatus === 'delivered') {
        order.delivered_at = new Date().toISOString()
      }
    }

    const historyEntry: OrderStatusHistoryItem = {
      id: 'hist-' + Math.random().toString(36).substring(2, 9),
      order_id: order.id,
      from_status: previousStatus,
      to_status: toStatus,
      changed_by_name: userName,
      synced_to_channel: true,
      created_at: new Date().toISOString()
    }

    order.status_history.push(historyEntry)
    this.save()
    return order
  }

  public injectSimulatedOrder(channel: ChannelType = 'ifood'): Order {
    const channelNames: Record<ChannelType, { prefix: string; name: string; payment: string }> = {
      ifood: { prefix: 'IF', name: 'iFood Delivery', payment: 'Pago no iFood (Crédito)' },
      '99food': { prefix: '99F', name: '99Food App', payment: 'Pago no 99Food (PIX)' },
      keeta: { prefix: 'KT', name: 'Keeta Delivery', payment: 'Pago no Keeta' },
      whatsapp: { prefix: 'WA', name: 'WhatsApp Bot IA', payment: 'PIX no WhatsApp' },
      own_site: { prefix: 'SITE', name: 'Site da Pizzaria', payment: 'Cartão na Entrega' }
    }

    const randNum = Math.floor(1000 + Math.random() * 9000)
    const newId = 'ord-' + Math.random().toString(36).substring(2, 9)
    const info = channelNames[channel]

    const samplePizzas = [
      { name: 'Pizza Portuguesa Tradicional (Grande)', price: 74.90, crust: 'Borda Recheada Catupiry', crustPrice: 12 },
      { name: 'Pizza Quatro Queijos Nobres (Grande)', price: 79.90, crust: 'Borda Vulcão Cheddar', crustPrice: 14 },
      { name: 'Pizza de Bacon com Alho Poró (Grande)', price: 82.00, crust: 'Borda sem recheio', crustPrice: 0 }
    ]
    const chosen = samplePizzas[Math.floor(Math.random() * samplePizzas.length)]

    const newOrder: Order = {
      id: newId,
      pizzeria_id: 'piz-123',
      channel_id: 'chan-' + channel,
      external_order_id: `${info.prefix}-${randNum}`,
      channel_type: channel,
      status: 'new',
      is_active: true,
      total_amount: chosen.price + chosen.crustPrice + 12.00,
      delivery_type: 'delivery',
      delivery_address: {
        street: 'Alameda Santos',
        number: String(100 + Math.floor(Math.random() * 800)),
        neighborhood: 'Cerqueira César',
        city: 'São Paulo',
        complement: 'Apto ' + Math.floor(10 + Math.random() * 90)
      },
      payment_method: info.payment,
      customer_notes: 'Cliente pediu para caprichar e entregar quentinho!',
      pdv_synced_at: null,
      received_at: new Date().toISOString(),
      delivered_at: null,
      customer: {
        name: 'Cliente ' + info.prefix + ' #' + randNum,
        phone: '(11) 9' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000)
      },
      items: [
        {
          id: 'item-' + Math.random().toString(36).substring(2, 7),
          order_id: newId,
          item_name: chosen.name,
          quantity: 1,
          unit_price: chosen.price,
          selected_options: chosen.crustPrice > 0 ? [{ name: chosen.crust, price: chosen.crustPrice, group: 'Borda' }] : []
        },
        {
          id: 'item-drink-' + Math.random().toString(36).substring(2, 7),
          order_id: newId,
          item_name: 'Refrigerante 2L',
          quantity: 1,
          unit_price: 12.00,
          selected_options: []
        }
      ],
      status_history: [
        {
          id: 'hist-' + Math.random().toString(36).substring(2, 7),
          order_id: newId,
          from_status: null,
          to_status: 'new',
          changed_by_name: info.name,
          synced_to_channel: true,
          created_at: new Date().toISOString()
        }
      ]
    }

    this.orders.unshift(newOrder)
    this.save()
    return newOrder
  }

  public resetToDefault() {
    this.orders = initialOrders
    this.save()
  }
}

export const orderService = new OrderStore()
