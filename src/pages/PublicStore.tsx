import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { menuService, MenuItem, MenuCategory, MenuItemOption } from '@/services/menuService'
import { orderService } from '@/services/orderService'
import {
  Pizza,
  ShoppingBag,
  Clock,
  Heart,
  Plus,
  Minus,
  X,
  CheckCircle2,
  ArrowRight,
  Truck,
  Store,
  MessageCircle,
  MapPin,
  Instagram,
  Percent,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid3x3
} from 'lucide-react'
import { getCategoryIcon } from '@/lib/menuDisplay'

interface CartItem {
  id: string
  menuItem: MenuItem
  quantity: number
  selectedOptions: MenuItemOption[]
  notes: string
  totalPrice: number
}

const WHATSAPP_NUMBER = '5521990178552'
const COUPON_CODE = 'FULLFORNERIA'

const DELIVERY_AREAS = [
  'Santa Cruz da Serra', 'Barro Branco', 'Jardim Anhangá', 'Imbariê', 'Ponte Preta',
  'Taquara', 'Parque Cristóvão Colombo', 'Parada Angélica', 'Santa Lúcia', 'Vila Angélica',
  'Jardim Nazareno', 'Fragoso / Limeira', 'Piabetá / Inhomirim / Maurimárcia', 'Raiz da Serra',
  'Pau Grande', 'Humaitá', 'Rio do Ouro', 'Parque dos Artistas', 'Parque Caçula'
]

const HERO_SLIDES = [
  {
    tag: 'Combo Família',
    title: '2 pizzas de 40cm + doce + guaraná 1,5L',
    price: 'R$ 139,98',
    image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80'
  },
  {
    tag: 'Combo +10',
    title: '1 pizza de 40cm + R$10 = pizza doce de brinde',
    price: 'R$ 64,99',
    image: 'https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&w=900&q=80'
  }
]

const buildWhatsAppLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

const isOpenNow = () => {
  const now = new Date()
  const day = now.getDay()
  if (day === 1) return false
  const minutes = now.getHours() * 60 + now.getMinutes()
  return minutes >= 18 * 60 && minutes <= 23 * 60 + 59
}

const getNavIcon = (categoryName: string) => {
  if (categoryName.toLowerCase().includes('combo')) return Percent
  return getCategoryIcon(categoryName)
}

export const PublicStore: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [heroSlide, setHeroSlide] = useState(0)
  const [couponCopied, setCouponCopied] = useState(false)

  // Carrinho
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Modal de Personalização
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalSelectedOptions, setModalSelectedOptions] = useState<Record<string, MenuItemOption>>({})
  const [modalNotes, setModalNotes] = useState('')

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [addressNeighborhood, setAddressNeighborhood] = useState('')
  const [addressComplement, setAddressComplement] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PIX na Entrega')
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null)

  useEffect(() => {
    setCategories(menuService.getCategories())
    setItems(menuService.getItems().filter((i) => i.is_available))

    const unsubscribe = menuService.subscribe(() => {
      setCategories(menuService.getCategories())
      setItems(menuService.getItems().filter((i) => i.is_available))
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const handleCopyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE)
      setCouponCopied(true)
      setTimeout(() => setCouponCopied(false), 2000)
    } catch {
      // clipboard indisponível — ignora silenciosamente
    }
  }

  // Abre modal de personalização do item
  const handleOpenItem = (item: MenuItem) => {
    setSelectedItemForModal(item)
    setModalQuantity(1)
    setModalNotes('')

    const defaults: Record<string, MenuItemOption> = {}
    if (item.options) {
      const groups = Array.from(new Set(item.options.map((o) => o.option_group)))
      groups.forEach((grp) => {
        const groupOpts = item.options!.filter((o) => o.option_group === grp)
        if (groupOpts.length > 0) {
          defaults[grp] = groupOpts[0]
        }
      })
    }
    setModalSelectedOptions(defaults)
  }

  const getModalUnitPrice = () => {
    if (!selectedItemForModal) return 0
    let price = selectedItemForModal.base_price
    Object.values(modalSelectedOptions).forEach((opt) => {
      price += opt.price_delta || 0
    })
    return price
  }

  const handleAddToCart = () => {
    if (!selectedItemForModal) return

    const unitPrice = getModalUnitPrice()
    const optionsList = Object.values(modalSelectedOptions)

    const cartItem: CartItem = {
      id: 'cart-' + Math.random().toString(36).substring(2, 9),
      menuItem: selectedItemForModal,
      quantity: modalQuantity,
      selectedOptions: optionsList,
      notes: modalNotes,
      totalPrice: unitPrice * modalQuantity
    }

    setCart((prev) => [...prev, cartItem])
    setSelectedItemForModal(null)
    setIsCartOpen(true)
  }

  const handleOrderItemOnWhatsApp = () => {
    if (!selectedItemForModal) return
    const unitPrice = getModalUnitPrice()
    let msg = `Olá! Vim pelo site e quero pedir:\n\n${modalQuantity}x ${selectedItemForModal.name}`
    if (modalNotes) msg += `\nObs: ${modalNotes}`
    msg += `\nValor: R$ ${(unitPrice * modalQuantity).toFixed(2).replace('.', ',')}`
    window.open(buildWhatsAppLink(msg), '_blank')
  }

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId))
  }

  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.totalPrice, 0)
  const deliveryFee = deliveryType === 'delivery' ? 8.00 : 0
  const cartTotal = cartSubtotal + deliveryFee

  const handleOrderCartOnWhatsApp = () => {
    let msg = 'Olá! Vim pelo site e quero fazer este pedido:\n\n'
    if (cart.length === 0) {
      msg = 'Olá! Vim pelo site da Full Forneria e gostaria de fazer um pedido.'
    } else {
      cart.forEach((c) => {
        msg += `${c.quantity}x ${c.menuItem.name}`
        if (c.notes) msg += ` (Obs: ${c.notes})`
        msg += ` — R$ ${c.totalPrice.toFixed(2).replace('.', ',')}\n`
      })
      msg += `\nTotal: R$ ${cartTotal.toFixed(2).replace('.', ',')}`
    }
    window.open(buildWhatsAppLink(msg), '_blank')
  }

  // Finalização do Pedido (Chama own-site-order e atualiza o hub em tempo real)
  const handleFinishOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !customerPhone) {
      alert('Por favor, informe seu nome e telefone WhatsApp.')
      return
    }

    if (deliveryType === 'delivery' && (!addressStreet || !addressNumber || !addressNeighborhood)) {
      alert('Por favor, informe seu endereço completo para entrega.')
      return
    }

    setOrderSubmitting(true)

    try {
      const siteOrderId = `SITE-${Math.floor(1000 + Math.random() * 9000)}`
      const newOrder = {
        id: 'ord-' + Math.random().toString(36).substring(2, 9),
        pizzeria_id: 'piz-123',
        channel_id: 'chan-site',
        external_order_id: siteOrderId,
        channel_type: 'own_site' as const,
        status: 'new' as const,
        is_active: true,
        total_amount: cartTotal,
        delivery_type: deliveryType,
        delivery_address: {
          street: addressStreet,
          number: addressNumber,
          neighborhood: addressNeighborhood,
          complement: addressComplement,
          city: 'Duque de Caxias'
        },
        payment_method: paymentMethod,
        customer_notes: cart.map((c) => c.notes).filter(Boolean).join(' | '),
        pdv_synced_at: null,
        received_at: new Date().toISOString(),
        delivered_at: null,
        customer: {
          name: customerName,
          phone: customerPhone
        },
        items: cart.map((c, i) => ({
          id: 'item-' + i,
          order_id: siteOrderId,
          item_name: c.menuItem.name,
          quantity: c.quantity,
          unit_price: c.totalPrice / c.quantity,
          selected_options: c.selectedOptions.map((o) => ({
            name: o.name,
            price: o.price_delta,
            group: o.option_group
          })),
          item_notes: c.notes || undefined
        })),
        status_history: [
          {
            id: 'hist-site-' + Math.random().toString(36).substring(2, 7),
            order_id: siteOrderId,
            from_status: null,
            to_status: 'new' as const,
            changed_by_name: 'Site Próprio (/loja)',
            synced_to_channel: true,
            created_at: new Date().toISOString()
          }
        ]
      }

      ;(orderService as any).orders.unshift(newOrder)
      ;(orderService as any).save()

      setSubmittedOrder({
        order_id: newOrder.id,
        external_order_id: siteOrderId,
        total: cartTotal,
        delivery_type: deliveryType,
        customer_name: customerName
      })
      setCart([])
      setIsCheckingOut(false)
      setIsCartOpen(false)
    } catch (err: any) {
      alert('Erro ao enviar pedido: ' + err.message)
    } finally {
      setOrderSubmitting(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false
    return true
  })

  const popularIds = ['item-combo-familia', 'item-combo-mais10', 'item-calabresa', 'item-frango-catupiry']
  const popularItems = items.filter((i) => popularIds.includes(i.id))

  // Tela de Sucesso de Pedido Enviado
  if (submittedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 font-sans text-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-pizza-600 uppercase tracking-widest">
              Pedido Recebido!
            </span>
            <h2 className="text-2xl font-extrabold text-neutral-900">Comanda #{submittedOrder.external_order_id}</h2>
            <p className="text-sm text-neutral-500">
              Obrigado, <strong className="text-neutral-700">{submittedOrder.customer_name}</strong>! Seu pedido foi enviado direto pra cozinha.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-2 text-xs text-left">
            <div className="flex justify-between text-neutral-500">
              <span>Status</span>
              <span className="text-emerald-600 font-bold">Novo / Aguardando Aceite</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Total a Pagar</span>
              <span className="text-pizza-600 font-bold text-sm">
                R$ {submittedOrder.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => setSubmittedOrder(null)}
              className="w-full py-3 px-4 bg-pizza-600 hover:bg-pizza-700 text-white font-bold text-sm rounded-full shadow-lg shadow-pizza-600/25 transition-all cursor-pointer"
            >
              Fazer Novo Pedido
            </button>
            <Link
              to="/unified-orders"
              className="block text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              (Visão interna: ver na Tela Unificada)
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const openNow = isOpenNow()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/60 to-amber-50 font-sans text-neutral-900 pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-amber-400 flex flex-col items-center justify-center leading-none shrink-0 shadow-sm">
              <span className="text-[10px] font-extrabold text-neutral-900 tracking-tight">FULL</span>
              <span className="text-[6px] font-extrabold text-white tracking-tight -mt-0.5">FORNERIA</span>
            </div>
            <div>
              <h1 className="font-extrabold text-base text-neutral-900 tracking-tight leading-none">Full Forneria</h1>
              <div className={`flex items-center gap-1 text-[11px] font-semibold mt-0.5 ${openNow ? 'text-emerald-600' : 'text-neutral-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${openNow ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
                {openNow ? 'Aberto agora' : 'Fechado agora'} · Ter–Dom 18h-23h59
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="w-11 h-11 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-all cursor-pointer relative shrink-0"
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pizza-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-8">
        {/* Hero Promo Carousel */}
        <section className="relative rounded-3xl bg-white shadow-md overflow-hidden">
          <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pizza-600 text-white text-[10px] font-bold">
            🔥 {HERO_SLIDES[heroSlide].tag}
          </div>
          <div className="grid sm:grid-cols-2 items-center">
            <div className="p-6 sm:p-8 order-2 sm:order-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight">
                {HERO_SLIDES[heroSlide].title}
              </h2>
              <p className="text-sm text-neutral-400 mt-2">A partir de</p>
              <p className="text-3xl font-extrabold text-pizza-600 -mt-1">{HERO_SLIDES[heroSlide].price}</p>
              <div className="flex items-center gap-3 mt-5">
                <a
                  href="#cardapio"
                  className="px-5 py-3 rounded-full bg-pizza-600 hover:bg-pizza-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-pizza-600/25 transition-all cursor-pointer"
                >
                  Peça Agora <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div className="relative h-48 sm:h-64 order-1 sm:order-2 overflow-hidden">
              <img
                src={HERO_SLIDES[heroSlide].image}
                alt={HERO_SLIDES[heroSlide].tag}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Carousel controls */}
          <button
            onClick={() => setHeroSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow items-center justify-center text-neutral-600 hover:text-neutral-900"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length)}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow items-center justify-center text-neutral-600 hover:text-neutral-900"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        <div className="flex items-center justify-center gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === heroSlide ? 'w-6 bg-pizza-600' : 'w-1.5 bg-pizza-200'
              }`}
            />
          ))}
        </div>

        {/* Cupom */}
        <section className="rounded-2xl border-2 border-dashed border-pizza-300 bg-pizza-50/60 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-xl">🎟️</span>
            <div>
              <span className="font-bold text-neutral-900">Cupom {COUPON_CODE}</span>
              <span className="text-neutral-500"> — 10% OFF na primeira compra</span>
            </div>
          </div>
          <button
            onClick={handleCopyCoupon}
            className="px-3.5 py-2 rounded-full bg-white border border-pizza-300 text-pizza-700 text-xs font-bold flex items-center gap-1.5 hover:bg-pizza-100 transition-all cursor-pointer shrink-0"
          >
            {couponCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {couponCopied ? 'Copiado!' : 'Copiar cupom'}
          </button>
        </section>

        {/* Category Icon Nav */}
        <section id="cardapio" className="flex items-center gap-5 overflow-x-auto pb-1 scroll-mt-20">
          <button onClick={() => setSelectedCategory('all')} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === 'all' ? 'bg-pizza-600 text-white shadow-lg shadow-pizza-600/25' : 'bg-white text-pizza-600 shadow-sm'
            }`}>
              <Grid3x3 className="w-5 h-5" />
            </div>
            <span className={`text-[11px] font-bold ${selectedCategory === 'all' ? 'text-neutral-900' : 'text-neutral-400'}`}>Todos</span>
          </button>
          {categories.map((cat) => {
            const Icon = getNavIcon(cat.name)
            const isSel = selectedCategory === cat.id
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isSel ? 'bg-pizza-600 text-white shadow-lg shadow-pizza-600/25' : 'bg-white text-pizza-600 shadow-sm'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-bold whitespace-nowrap ${isSel ? 'text-neutral-900' : 'text-neutral-400'}`}>{cat.name}</span>
              </button>
            )
          })}
        </section>

        {/* Populares */}
        {selectedCategory === 'all' && popularItems.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-neutral-900">Mais Pedidos</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {popularItems.map((item) => {
                const isFav = favorites.has(item.id)
                return (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
                    <div className="relative h-28 sm:h-32 w-full bg-neutral-100 overflow-hidden">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center cursor-pointer"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-pizza-600 text-pizza-600' : 'text-neutral-400'}`} />
                      </button>
                    </div>
                    <div className="p-3 space-y-1">
                      <h3 className="text-xs font-bold text-neutral-900 leading-tight line-clamp-2 min-h-[2rem]">{item.name}</h3>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-extrabold text-pizza-600">R$ {item.base_price.toFixed(2).replace('.', ',')}</span>
                        <button
                          onClick={() => handleOpenItem(item)}
                          className="w-7 h-7 rounded-full bg-pizza-600 hover:bg-pizza-700 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Cardápio Completo (filtrado) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-neutral-900">
              {selectedCategory === 'all' ? 'Cardápio Completo' : categories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <span className="text-xs text-neutral-400 font-semibold">{filteredItems.length} itens</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isFav = favorites.has(item.id)
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
                  <div className="relative h-32 sm:h-36 w-full bg-neutral-100 overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center cursor-pointer"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-pizza-600 text-pizza-600' : 'text-neutral-400'}`} />
                    </button>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h3 className="text-sm font-bold text-neutral-900 leading-tight">{item.name}</h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 min-h-[1.75rem]">{item.description}</p>
                    <div className="flex items-center justify-between pt-1.5">
                      <span className="text-sm font-extrabold text-pizza-600">R$ {item.base_price.toFixed(2).replace('.', ',')}</span>
                      <button
                        onClick={() => handleOpenItem(item)}
                        className="w-8 h-8 rounded-full bg-pizza-600 hover:bg-pizza-700 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Área de Entrega */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pizza-600" />
            <h2 className="text-sm font-extrabold text-neutral-900">Área de Entrega</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_AREAS.map((area) => (
              <span key={area} className="px-3 py-1.5 rounded-full bg-white text-[11px] font-semibold text-neutral-500 shadow-sm">
                {area}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-10 bg-neutral-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-400 flex flex-col items-center justify-center leading-none shrink-0">
                <span className="text-[9px] font-extrabold text-neutral-900">FULL</span>
                <span className="text-[5px] font-extrabold text-white -mt-0.5">FORNERIA</span>
              </div>
              <span className="font-extrabold text-lg">Full Forneria</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Pizzas de 40cm, combos e sabores campeões. Peça pelo WhatsApp, iFood ou 99Food.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Peça pelo</span>
            <a href={buildWhatsAppLink('Olá! Vim pelo site e gostaria de fazer um pedido.')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp (21) 99017-8552
            </a>
            <div className="flex items-center gap-2 text-white/70">
              <Store className="w-3.5 h-3.5" /> iFood e 99Food
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="w-3.5 h-3.5" /> Ter–Dom · 18h às 23h59
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Redes sociais</span>
            <div className="flex items-center gap-2 text-white/70">
              <Instagram className="w-3.5 h-3.5" /> @FULLFORNEIRA
            </div>
            <Link to="/unified-orders" className="inline-block text-white/40 hover:text-white/70 transition-colors mt-2">
              Acesso da equipe interna →
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-[11px] text-white/30">
          © {new Date().getFullYear()} Full Forneria — Todos os direitos reservados
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={buildWhatsAppLink('Olá! Vim pelo site e gostaria de fazer um pedido.')}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-all cursor-pointer"
        title="Pedir pelo WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* ========================================================================= */}
      {/* MODAL: Personalização do Item */}
      {/* ========================================================================= */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative h-44 w-full bg-neutral-100 shrink-0">
              <img src={selectedItemForModal.image_url} alt={selectedItemForModal.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <button onClick={() => setSelectedItemForModal(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-lg font-extrabold text-white leading-tight">{selectedItemForModal.name}</h3>
                <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{selectedItemForModal.description}</p>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {selectedItemForModal.options && selectedItemForModal.options.length > 0 ? (
                Array.from(new Set(selectedItemForModal.options.map((o) => o.option_group))).map((grp) => {
                  const groupOptions = selectedItemForModal.options!.filter((o) => o.option_group === grp)
                  return (
                    <div key={grp} className="space-y-2">
                      <div className="font-bold text-neutral-400 uppercase tracking-wider text-[11px]">{grp}</div>
                      <div className="space-y-1.5">
                        {groupOptions.map((opt) => {
                          const isSelected = modalSelectedOptions[grp]?.id === opt.id
                          return (
                            <label
                              key={opt.id}
                              onClick={() => setModalSelectedOptions((prev) => ({ ...prev, [grp]: opt }))}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isSelected ? 'bg-pizza-50 border-pizza-400 text-neutral-900 font-semibold' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-pizza-600 bg-pizza-600 text-white' : 'border-neutral-300'}`}>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span>{opt.name}</span>
                              </div>
                              <span className="font-bold text-pizza-600">
                                {opt.price_delta > 0 ? `+ R$ ${opt.price_delta.toFixed(2).replace('.', ',')}` : 'Incluso'}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-neutral-400 italic text-center py-2">Item sem opções configuráveis adicionais.</p>
              )}

              <div className="space-y-1">
                <label className="text-neutral-600 font-semibold block text-[11px]">Observações para a cozinha</label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Ex: sem cebola, massa bem tostada..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-pizza-400"
                />
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100 bg-white space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center bg-neutral-100 rounded-full p-1">
                  <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))} className="p-1.5 text-neutral-500 hover:text-neutral-900">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 font-bold text-neutral-900 text-xs">{modalQuantity}</span>
                  <button onClick={() => setModalQuantity(modalQuantity + 1)} className="p-1.5 text-neutral-500 hover:text-neutral-900">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 bg-pizza-600 hover:bg-pizza-700 text-white rounded-full text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
                >
                  <span>Adicionar ao Carrinho</span>
                  <span>R$ {(getModalUnitPrice() * modalQuantity).toFixed(2).replace('.', ',')}</span>
                </button>
              </div>
              <button
                onClick={handleOrderItemOnWhatsApp}
                className="w-full py-2.5 px-4 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Pedir esse item no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: Carrinho Deslizante & Checkout */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />

          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-neutral-50 shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-pizza-600" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  {isCheckingOut ? 'Finalizar Pedido' : 'Seu Carrinho'}
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {!isCheckingOut ? (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-16 space-y-2 text-neutral-400">
                      <ShoppingBag className="w-12 h-12 text-neutral-200 mx-auto" />
                      <p className="text-neutral-500">Seu carrinho está vazio.</p>
                      <p className="text-[11px] text-neutral-400">Adicione pizzas deliciosas para pedir!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((c) => (
                        <div key={c.id} className="p-3.5 rounded-2xl bg-white shadow-sm space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-neutral-900">{c.quantity}x {c.menuItem.name}</span>
                              {c.selectedOptions.length > 0 && (
                                <div className="text-[11px] text-pizza-600">{c.selectedOptions.map((o) => o.name).join(', ')}</div>
                              )}
                              {c.notes && <div className="text-[11px] text-neutral-400 italic">Obs: {c.notes}</div>}
                            </div>
                            <button onClick={() => handleRemoveFromCart(c.id)} className="text-neutral-400 hover:text-pizza-600 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right font-bold text-neutral-900 text-xs">R$ {c.totalPrice.toFixed(2).replace('.', ',')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form id="checkout-form" onSubmit={handleFinishOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                        deliveryType === 'delivery' ? 'bg-pizza-50 border-pizza-400 text-pizza-600' : 'bg-white border-neutral-200 text-neutral-500'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Entrega (R$ 8,00)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                        deliveryType === 'pickup' ? 'bg-pizza-50 border-pizza-400 text-pizza-600' : 'bg-white border-neutral-200 text-neutral-500'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Retirada (Grátis)</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-neutral-600 font-semibold block text-[11px]">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-pizza-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-neutral-600 font-semibold block text-[11px]">WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(21) 98765-4321"
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-pizza-400"
                    />
                  </div>

                  {deliveryType === 'delivery' && (
                    <div className="space-y-2 border-t border-neutral-200 pt-3">
                      <span className="text-[11px] font-bold uppercase text-neutral-400">Endereço de Entrega</span>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          value={addressStreet}
                          onChange={(e) => setAddressStreet(e.target.value)}
                          placeholder="Rua / Avenida"
                          className="col-span-2 px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-pizza-400"
                        />
                        <input
                          type="text"
                          required
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                          placeholder="Nº"
                          className="px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-pizza-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          required
                          value={addressNeighborhood}
                          onChange={(e) => setAddressNeighborhood(e.target.value)}
                          className="px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-pizza-400"
                        >
                          <option value="">Bairro...</option>
                          {DELIVERY_AREAS.map((area) => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={addressComplement}
                          onChange={(e) => setAddressComplement(e.target.value)}
                          placeholder="Apto / Bloco"
                          className="px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-pizza-400"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 border-t border-neutral-200 pt-3">
                    <span className="text-[11px] font-bold uppercase text-neutral-400">Forma de Pagamento</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 text-xs focus:outline-none focus:border-pizza-400"
                    >
                      <option value="PIX na Entrega">PIX no ato da entrega</option>
                      <option value="Cartão de Crédito">Cartão de Crédito (Maquininha)</option>
                      <option value="Cartão de Débito">Cartão de Débito (Maquininha)</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>
                </form>
              )}
            </div>

            <div className="p-4 border-t border-neutral-200 bg-white space-y-3 shrink-0">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-700">R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Entrega</span>
                  <span className="font-semibold text-neutral-700">{deliveryType === 'delivery' ? 'R$ 8,00' : 'Grátis'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span className="text-base text-pizza-600">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {!isCheckingOut ? (
                <>
                  <button
                    disabled={cart.length === 0}
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full py-3.5 px-4 bg-pizza-600 hover:bg-pizza-700 disabled:opacity-40 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Continuar para Entrega</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleOrderCartOnWhatsApp}
                    className="w-full py-3 px-4 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" /> Ou finalize pelo WhatsApp
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="py-3.5 px-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-full text-xs font-bold"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={orderSubmitting}
                    className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {orderSubmitting ? 'Enviando Pedido...' : 'Confirmar e Enviar Pedido'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
