import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { menuService, MenuItem, MenuCategory, MenuItemOption } from '@/services/menuService'
import { orderService } from '@/services/orderService'
import {
  Pizza,
  ShoppingBag,
  Clock,
  Star,
  MapPin,
  Plus,
  Minus,
  X,
  CheckCircle2,
  ArrowRight,
  Flame,
  Truck,
  Store,
  Phone,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle
} from 'lucide-react'

interface CartItem {
  id: string
  menuItem: MenuItem
  quantity: number
  selectedOptions: MenuItemOption[]
  notes: string
  totalPrice: number
}

export const PublicStore: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

  // Abre modal de personalização do item
  const handleOpenItem = (item: MenuItem) => {
    setSelectedItemForModal(item)
    setModalQuantity(1)
    setModalNotes('')

    // Pré-seleciona a primeira opção de cada grupo (ex: tamanho padrão)
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

  // Calcula preço unitário customizado no modal
  const getModalUnitPrice = () => {
    if (!selectedItemForModal) return 0
    let price = selectedItemForModal.base_price
    Object.values(modalSelectedOptions).forEach((opt) => {
      price += opt.price_delta || 0
    })
    return price
  }

  // Adiciona ao carrinho
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

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId))
  }

  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.totalPrice, 0)
  const deliveryFee = deliveryType === 'delivery' ? 8.00 : 0
  const cartTotal = cartSubtotal + deliveryFee

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
      // 1. Injeta pedido no orderService para que o atendente e cozinha recebam no ato
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
          city: 'São Paulo'
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

      // Adiciona ao store de pedidos
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

  // Tela de Sucesso de Pedido Enviado
  if (submittedOrder) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest font-mono">
              Pedido Recebido!
            </span>
            <h2 className="text-2xl font-black text-white">Comanda #{submittedOrder.external_order_id}</h2>
            <p className="text-xs text-slate-400">
              Obrigado, <strong>{submittedOrder.customer_name}</strong>! Seu pedido foi enviado diretamente para a cozinha da pizzaria.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs text-left">
            <div className="flex justify-between text-slate-400">
              <span>Status</span>
              <span className="text-emerald-400 font-bold">Novo / Aguardando Aceite</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tempo Estimado</span>
              <span className="text-white font-mono font-semibold">35 - 45 min</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total a Pagar</span>
              <span className="text-orange-400 font-bold font-mono text-sm">
                R$ {submittedOrder.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => setSubmittedOrder(null)}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
            >
              Fazer Novo Pedido
            </button>
            <Link
              to="/unified-orders"
              className="block text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              (Visão interna: ver na Tela Unificada)
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white pb-20">
      {/* Top Bar / Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Pizza className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white tracking-tight">Pizzaria Bella Napoli</h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Aberto Agora
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 35-45 min
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 flex items-center gap-2 transition-all cursor-pointer relative"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Carrinho</span>
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-orange-600 font-mono text-[10px] font-extrabold flex items-center justify-center">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-xs font-bold border border-orange-500/20">
              <Flame className="w-3.5 h-3.5" /> Forno à Lenha & Massa Artesanal
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Cardápio Oficial para Pedidos Online</h2>
            <p className="text-xs text-slate-400 max-w-lg">
              Peça diretamente com a nossa pizzaria sem intermediários. Entrega rápida, bordas recheadas e ingredientes selecionados.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs font-medium text-slate-300">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Avaliação</span>
              <span className="text-amber-400 font-bold flex items-center justify-center gap-1 text-sm font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9 (580+)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-4 sticky top-[60px] z-20 bg-slate-950/95 backdrop-blur-md pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl font-semibold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.category_id === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl font-semibold shrink-0 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-6xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
            >
              <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-lg font-black font-mono text-white drop-shadow-md">
                  R$ {item.base_price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenItem(item)}
                  className="w-full py-2.5 px-4 bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white rounded-xl text-xs font-bold border border-orange-500/20 hover:border-orange-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Personalizar e Pedir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL: Personalização do Item (Bordas, Tamanhos, Observações) */}
      {/* ========================================================================= */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header with Image */}
            <div className="relative h-44 w-full bg-slate-950 shrink-0">
              <img
                src={selectedItemForModal.image_url}
                alt={selectedItemForModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-lg font-bold text-white leading-tight">{selectedItemForModal.name}</h3>
                <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{selectedItemForModal.description}</p>
              </div>
            </div>

            {/* Modal Body: Options Groups */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {selectedItemForModal.options && selectedItemForModal.options.length > 0 ? (
                Array.from(new Set(selectedItemForModal.options.map((o) => o.option_group))).map((grp) => {
                  const groupOptions = selectedItemForModal.options!.filter((o) => o.option_group === grp)
                  return (
                    <div key={grp} className="space-y-2">
                      <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                        {grp}
                      </div>
                      <div className="space-y-1.5">
                        {groupOptions.map((opt) => {
                          const isSelected = modalSelectedOptions[grp]?.id === opt.id
                          return (
                            <label
                              key={opt.id}
                              onClick={() =>
                                setModalSelectedOptions((prev) => ({
                                  ...prev,
                                  [grp]: opt
                                }))
                              }
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-orange-500/10 border-orange-500/40 text-white font-semibold'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-600'
                                  }`}
                                >
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span>{opt.name}</span>
                              </div>
                              <span className="font-mono text-orange-400">
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
                <p className="text-slate-500 italic text-center py-2">Item sem opções configuráveis adicionais.</p>
              )}

              {/* Observações */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block text-[11px]">Observações para a cozinha</label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Ex: sem cebola, massa bem tostada..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 shrink-0">
              {/* Quantidade */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 font-mono font-bold text-white text-xs">{modalQuantity}</span>
                <button
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Botão Adicionar */}
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/20 flex items-center justify-between transition-all cursor-pointer"
              >
                <span>Adicionar ao Carrinho</span>
                <span className="font-mono">R$ {(getModalUnitPrice() * modalQuantity).toFixed(2).replace('.', ',')}</span>
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />

          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white">
                  {isCheckingOut ? 'Finalizar Pedido' : 'Seu Carrinho'}
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {!isCheckingOut ? (
                <>
                  {cart.length === 0 ? (
                    <div className="text-center py-16 space-y-2 text-slate-400">
                      <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto" />
                      <p>Seu carrinho está vazio.</p>
                      <p className="text-[11px] text-slate-500">Adicione pizzas deliciosas para pedir!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((c) => (
                        <div key={c.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-white">
                                {c.quantity}x {c.menuItem.name}
                              </span>
                              {c.selectedOptions.length > 0 && (
                                <div className="text-[11px] text-orange-400">
                                  {c.selectedOptions.map((o) => o.name).join(', ')}
                                </div>
                              )}
                              {c.notes && <div className="text-[11px] text-slate-400 italic">Obs: {c.notes}</div>}
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(c.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-right font-mono font-bold text-white text-xs">
                            R$ {c.totalPrice.toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Formulário de Checkout */
                <form id="checkout-form" onSubmit={handleFinishOrder} className="space-y-4">
                  {/* Delivery vs Retirada */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                        deliveryType === 'delivery'
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Entrega (R$ 8,00)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-3 rounded-2xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                        deliveryType === 'pickup'
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      <span>Retirada (Grátis)</span>
                    </button>
                  </div>

                  {/* Dados do Cliente */}
                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold block text-[11px]">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nome completo"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 font-semibold block text-[11px]">WhatsApp / Celular *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Endereço caso entrega */}
                  {deliveryType === 'delivery' && (
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <span className="text-[11px] font-bold uppercase text-slate-400">Endereço de Entrega</span>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          value={addressStreet}
                          onChange={(e) => setAddressStreet(e.target.value)}
                          placeholder="Rua / Avenida"
                          className="col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                        <input
                          type="text"
                          required
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                          placeholder="Nº"
                          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={addressNeighborhood}
                          onChange={(e) => setAddressNeighborhood(e.target.value)}
                          placeholder="Bairro"
                          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                        <input
                          type="text"
                          value={addressComplement}
                          onChange={(e) => setAddressComplement(e.target.value)}
                          placeholder="Apto / Bloco"
                          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Forma de Pagamento */}
                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Forma de Pagamento</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-orange-500"
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

            {/* Cart Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3 shrink-0">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono">R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Entrega</span>
                  <span className="font-mono">
                    {deliveryType === 'delivery' ? 'R$ 8,00' : 'Grátis'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total</span>
                  <span className="font-mono text-base text-orange-400">
                    R$ {cartTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {!isCheckingOut ? (
                <button
                  disabled={cart.length === 0}
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continuar para Entrega</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={orderSubmitting}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
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
