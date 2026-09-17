import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import {
  menuService,
  MenuCategory,
  MenuItem,
  MenuItemOption
} from '@/services/menuService'
import {
  MenuSquare,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Tag,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Upload,
  Image as ImageIcon,
  DollarSign,
  PlusCircle,
  Eye,
  EyeOff,
  X,
  Check,
  Store,
  MessageSquare,
  Leaf
} from 'lucide-react'
import { isVegetariana, hasMultipleSizes } from '@/lib/menuDisplay'

export const MenuManagement: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCatId, setSelectedCatId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'active' | 'paused'>('all')

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = useState({
    category_id: '',
    name: '',
    description: '',
    base_price: '',
    image_url: ''
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [catNameInput, setCatNameInput] = useState('')
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null)

  // Options Modal
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const [selectedItemForOptions, setSelectedItemForOptions] = useState<MenuItem | null>(null)
  const [optionForm, setOptionForm] = useState({
    option_group: 'Borda',
    name: '',
    price_delta: ''
  })

  const refreshData = () => {
    setCategories(menuService.getCategories())
    setItems(menuService.getItems())
  }

  useEffect(() => {
    refreshData()
    const unsubscribe = menuService.subscribe(() => {
      refreshData()
    })
    return () => unsubscribe()
  }, [])

  // Filtragem
  const filteredItems = items.filter((item) => {
    if (selectedCatId !== 'all' && item.category_id !== selectedCatId) return false
    if (filterAvailability === 'active' && !item.is_available) return false
    if (filterAvailability === 'paused' && item.is_available) return false
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      const matchName = item.name.toLowerCase().includes(q)
      const matchDesc = item.description.toLowerCase().includes(q)
      if (!matchName && !matchDesc) return false
    }
    return true
  })

  const totalActive = items.filter((i) => i.is_available).length
  const totalPaused = items.filter((i) => !i.is_available).length

  // Handlers de Item
  const handleOpenCreateItem = () => {
    setEditingItem(null)
    setItemForm({
      category_id: categories[0]?.id || '',
      name: '',
      description: '',
      base_price: '',
      image_url: ''
    })
    setIsItemModalOpen(true)
  }

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description,
      base_price: String(item.base_price),
      image_url: item.image_url
    })
    setIsItemModalOpen(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemForm.name || !itemForm.base_price || !itemForm.category_id) {
      alert('Preencha os campos obrigatórios.')
      return
    }

    if (editingItem) {
      await menuService.updateItem(editingItem.id, {
        category_id: itemForm.category_id,
        name: itemForm.name,
        description: itemForm.description,
        base_price: parseFloat(itemForm.base_price),
        image_url: itemForm.image_url || editingItem.image_url
      })
    } else {
      await menuService.createItem({
        category_id: itemForm.category_id,
        name: itemForm.name,
        description: itemForm.description,
        base_price: parseFloat(itemForm.base_price),
        image_url: itemForm.image_url
      })
    }

    setIsItemModalOpen(false)
  }

  const handleToggleAvailable = async (itemId: string) => {
    await menuService.toggleAvailability(itemId)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Deseja realmente remover este item do cardápio?')) {
      await menuService.deleteItem(itemId)
    }
  }

  // Upload de Imagem
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const url = await menuService.uploadItemImage(file)
      setItemForm((prev) => ({ ...prev, image_url: url }))
    } catch (err: any) {
      alert('Erro ao carregar imagem: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  // Handlers de Categoria
  const handleOpenCreateCat = () => {
    setEditingCat(null)
    setCatNameInput('')
    setIsCatModalOpen(true)
  }

  const handleOpenEditCat = (cat: MenuCategory) => {
    setEditingCat(cat)
    setCatNameInput(cat.name)
    setIsCatModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catNameInput.trim()) return

    if (editingCat) {
      await menuService.updateCategory(editingCat.id, catNameInput)
    } else {
      await menuService.createCategory(catNameInput)
    }
    setIsCatModalOpen(false)
  }

  const handleDeleteCategory = async (catId: string) => {
    if (confirm('Atenção: excluir a categoria removerá os itens vinculados a ela. Continuar?')) {
      await menuService.deleteCategory(catId)
    }
  }

  // Handlers de Opções
  const handleOpenOptions = (item: MenuItem) => {
    setSelectedItemForOptions(item)
    setOptionForm({
      option_group: 'Borda',
      name: '',
      price_delta: ''
    })
    setIsOptionsModalOpen(true)
  }

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemForOptions || !optionForm.name) return

    await menuService.addOption(
      selectedItemForOptions.id,
      optionForm.option_group,
      optionForm.name,
      parseFloat(optionForm.price_delta) || 0
    )

    // Atualiza o item local no modal
    const updated = menuService.getItemById(selectedItemForOptions.id)
    if (updated) setSelectedItemForOptions(updated)

    setOptionForm({
      option_group: optionForm.option_group,
      name: '',
      price_delta: ''
    })
  }

  const handleDeleteOption = async (optionId: string) => {
    if (!selectedItemForOptions) return
    await menuService.deleteOption(selectedItemForOptions.id, optionId)
    const updated = menuService.getItemById(selectedItemForOptions.id)
    if (updated) setSelectedItemForOptions(updated)
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <MenuSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Gestão do Cardápio Próprio</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">
                    WhatsApp & Site /loja
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Itens, fotos, bordas e adicionais que alimentam a IA no WhatsApp e a vitrine pública de pedidos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenCreateCat}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span>Nova Categoria</span>
            </button>

            <button
              onClick={handleOpenCreateItem}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Informative Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              Pausa rápida de sabor ativa: desmarque a chave de qualquer pizza para pausá-la imediatamente do WhatsApp e do site.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
            <span className="text-emerald-400">● {totalActive} Ativos</span>
            <span className="text-amber-400">⏸ {totalPaused} Pausados</span>
          </div>
        </div>

        {/* Toolbar: Categories Tabs + Search */}
        <div className="space-y-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCatId('all')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
                selectedCatId === 'all'
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todas as Categorias ({items.length})
            </button>

            {categories.map((cat) => {
              const count = items.filter((i) => i.category_id === cat.id).length
              const isSel = selectedCatId === cat.id
              return (
                <div key={cat.id} className="relative group shrink-0">
                  <button
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-black/30 text-[10px] font-mono">
                      {count}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Search and Availability Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por sabor, ingrediente ou descrição..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterAvailability('all')}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                  filterAvailability === 'all'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterAvailability('active')}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                  filterAvailability === 'active'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
                }`}
              >
                Disponíveis
              </button>
              <button
                onClick={() => setFilterAvailability('paused')}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
                  filterAvailability === 'paused'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                }`}
              >
                Pausados / Esgotados
              </button>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto">
              <MenuSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Nenhum produto cadastrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Cadastre suas pizzas, bebidas e sobremesas para que o assistente de IA e o site próprio comecem a vender.
            </p>
            <button
              onClick={handleOpenCreateItem}
              className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/20"
            >
              Adicionar Primeiro Produto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const catName = categories.find((c) => c.id === item.category_id)?.name || 'Geral'
              const optionsCount = item.options?.length || 0
              const vegetariana = catName.toLowerCase().includes('pizza') && isVegetariana(item)
              const showFromLabel = hasMultipleSizes(item)

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition-all ${
                    item.is_available
                      ? 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700'
                      : 'bg-slate-950/80 border-slate-800/60 opacity-75'
                  }`}
                >
                  {/* Item Image & Quick Availability Badge */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden group">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

                    {/* Category pill + Vegetariana badge */}
                    <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-orange-400 border border-white/10">
                        {catName}
                      </span>
                      {vegetariana && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold shadow">
                          <Leaf className="w-3 h-3" /> Vegetariana
                        </span>
                      )}
                    </div>

                    {/* Quick Availability Toggle */}
                    <button
                      onClick={() => handleToggleAvailable(item.id)}
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border flex items-center gap-1.5 transition-all shadow-md ${
                        item.is_available
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                      title="Clique para alternar disponibilidade para vendas"
                    >
                      <span className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span>{item.is_available ? 'Disponível' : 'Pausado'}</span>
                    </button>

                    {/* Price Tag Overlay */}
                    <div className="absolute bottom-3 left-3">
                      {showFromLabel && (
                        <span className="block text-[10px] text-slate-300 uppercase font-semibold tracking-wide">
                          A partir de
                        </span>
                      )}
                      <span className="text-lg font-extrabold font-mono text-white drop-shadow-md">
                        R$ {item.base_price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Body: Title, Description, Options preview */}
                  <div className="p-4 space-y-3 flex-1">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-snug">{item.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Options Pills Preview */}
                    {item.options && item.options.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                          Bordas e Complementos ({item.options.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.options.slice(0, 3).map((opt) => (
                            <span
                              key={opt.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-orange-400 border border-slate-700/60 font-medium truncate max-w-[140px]"
                            >
                              {opt.name} {opt.price_delta > 0 ? `(+R$ ${opt.price_delta})` : ''}
                            </span>
                          ))}
                          {item.options.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                              +{item.options.length - 3} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenOptions(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Configurar opções de bordas, tamanhos e adicionais"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Opções ({optionsCount})</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditItem(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Editar produto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remover produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: Cadastrar / Editar Produto */}
        {/* ========================================================================= */}
        {isItemModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Editar Produto do Cardápio' : 'Cadastrar Novo Produto'}
                </h3>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Categoria *</label>
                  <select
                    required
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nome do Item *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="Ex: Pizza Calabresa Especial"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Descrição / Ingredientes</label>
                  <textarea
                    rows={3}
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Descreva os ingredientes da pizza para a IA e o cardápio do WhatsApp..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Preço Base (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.base_price}
                    onChange={(e) => setItemForm({ ...itemForm, base_price: e.target.value })}
                    placeholder="64.90"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Upload Foto Supabase Storage */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Foto do Produto (Supabase Storage)</label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors">
                      <Upload className="w-4 h-4 text-orange-400" />
                      <span>{uploadingImage ? 'Enviando...' : 'Carregar Imagem'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={itemForm.image_url}
                      onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                      placeholder="Ou cole o link direto da imagem..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                    />
                  </div>
                  {itemForm.image_url && (
                    <div className="mt-2 w-20 h-20 rounded-xl border border-slate-800 overflow-hidden">
                      <img src={itemForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20"
                  >
                    Salvar Produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: Gerenciar Opções do Produto (Bordas, Tamanhos, Adicionais) */}
        {/* ========================================================================= */}
        {isOptionsModalOpen && selectedItemForOptions && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Opções & Complementos</h3>
                  <p className="text-xs text-orange-400 font-medium">{selectedItemForOptions.name}</p>
                </div>
                <button
                  onClick={() => setIsOptionsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Adicionar Nova Opção */}
              <form onSubmit={handleAddOption} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                <div className="font-bold text-slate-300">Adicionar Nova Opção:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Grupo</label>
                    <select
                      value={optionForm.option_group}
                      onChange={(e) => setOptionForm({ ...optionForm, option_group: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="Borda">Borda</option>
                      <option value="Tamanho">Tamanho</option>
                      <option value="Massa">Massa</option>
                      <option value="Adicionais">Adicionais</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Nome da Opção</label>
                    <input
                      type="text"
                      required
                      value={optionForm.name}
                      onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                      placeholder="Ex: Vulcão Catupiry"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Acréscimo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={optionForm.price_delta}
                      onChange={(e) => setOptionForm({ ...optionForm, price_delta: e.target.value })}
                      placeholder="14.00"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir Opção</span>
                </button>
              </form>

              {/* Lista de Opções Existentes */}
              <div className="space-y-2 text-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Opções Configuradas ({selectedItemForOptions.options?.length || 0})
                </div>

                {(!selectedItemForOptions.options || selectedItemForOptions.options.length === 0) ? (
                  <p className="text-slate-500 italic text-center py-4">Nenhuma opção configurada ainda.</p>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {selectedItemForOptions.options.map((opt) => (
                      <div key={opt.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-orange-400 font-bold mr-2">
                            {opt.option_group}
                          </span>
                          <span className="text-white font-medium">{opt.name}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-300">
                            {opt.price_delta > 0 ? `+ R$ ${opt.price_delta.toFixed(2).replace('.', ',')}` : 'Grátis'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(opt.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remover opção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setIsOptionsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: Cadastrar / Editar Categoria */}
        {/* ========================================================================= */}
        {isCatModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingCat ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
                <button
                  onClick={() => setIsCatModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nome da Categoria</label>
                  <input
                    type="text"
                    required
                    value={catNameInput}
                    onChange={(e) => setCatNameInput(e.target.value)}
                    placeholder="Ex: Pizzas Premium"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(false)}
                    className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20"
                  >
                    Salvar Categoria
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
