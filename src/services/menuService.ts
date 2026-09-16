import { supabase } from '@/lib/supabase'

export interface MenuCategory {
  id: string
  pizzeria_id: string
  name: string
  sort_order: number
}

export interface MenuItemOption {
  id: string
  menu_item_id: string
  option_group: 'Tamanho' | 'Borda' | 'Massa' | 'Adicionais' | string
  name: string
  price_delta: number
}

export interface MenuItem {
  id: string
  pizzeria_id: string
  category_id: string
  name: string
  description: string
  base_price: number
  image_url: string
  is_available: boolean
  created_at: string
  options?: MenuItemOption[]
}

const initialCategories: MenuCategory[] = [
  { id: 'cat-1', pizzeria_id: 'piz-123', name: 'Pizzas Salgadas Tradicionais', sort_order: 1 },
  { id: 'cat-2', pizzeria_id: 'piz-123', name: 'Pizzas Especiais & Gourmet', sort_order: 2 },
  { id: 'cat-3', pizzeria_id: 'piz-123', name: 'Pizzas Doces', sort_order: 3 },
  { id: 'cat-4', pizzeria_id: 'piz-123', name: 'Bebidas & Refrigerantes', sort_order: 4 }
]

const initialItems: MenuItem[] = [
  {
    id: 'item-101',
    pizzeria_id: 'piz-123',
    category_id: 'cat-1',
    name: 'Pizza Calabresa Artesanal',
    description: 'Molho de tomate italiano pelati, mussarela especial, calabresa fatiada fina, rodelas de cebola roxa fresca e orégano.',
    base_price: 64.90,
    image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: [
      { id: 'opt-1', menu_item_id: 'item-101', option_group: 'Tamanho', name: 'Média (6 fatias)', price_delta: 0 },
      { id: 'opt-2', menu_item_id: 'item-101', option_group: 'Tamanho', name: 'Grande (8 fatias)', price_delta: 12.00 },
      { id: 'opt-3', menu_item_id: 'item-101', option_group: 'Borda', name: 'Borda Vulcão Catupiry Original', price_delta: 14.00 },
      { id: 'opt-4', menu_item_id: 'item-101', option_group: 'Borda', name: 'Borda Recheada Cheddar Cremoso', price_delta: 12.00 },
      { id: 'opt-5', menu_item_id: 'item-101', option_group: 'Adicionais', name: 'Bacon Crocante Extra', price_delta: 6.00 }
    ]
  },
  {
    id: 'item-102',
    pizzeria_id: 'piz-123',
    category_id: 'cat-1',
    name: 'Pizza Margherita Napolitana',
    description: 'Molho artesanal de tomates maduros, fatias de mussarela de búfala fresca, queijo parmesão ralado e manjericão fresco colhido.',
    base_price: 68.00,
    image_url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: [
      { id: 'opt-6', menu_item_id: 'item-102', option_group: 'Tamanho', name: 'Grande (8 fatias)', price_delta: 0 },
      { id: 'opt-7', menu_item_id: 'item-102', option_group: 'Borda', name: 'Borda Tradicional Crocante', price_delta: 0 },
      { id: 'opt-8', menu_item_id: 'item-102', option_group: 'Adicionais', name: 'Tomate Cereja Confitado Extra', price_delta: 5.00 }
    ]
  },
  {
    id: 'item-103',
    pizzeria_id: 'piz-123',
    category_id: 'cat-2',
    name: 'Pizza Quatro Queijos Nobres',
    description: 'Combinação refinada de mussarela de cura, provolone defumado, gorgonzola cremoso e catupiry legítimo sobre massa artesanal.',
    base_price: 79.90,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: [
      { id: 'opt-9', menu_item_id: 'item-103', option_group: 'Tamanho', name: 'Grande (8 fatias)', price_delta: 0 },
      { id: 'opt-10', menu_item_id: 'item-103', option_group: 'Borda', name: 'Borda Vulcão Quatro Queijos', price_delta: 16.00 }
    ]
  },
  {
    id: 'item-104',
    pizzeria_id: 'piz-123',
    category_id: 'cat-3',
    name: 'Pizza Doce Banana com Canela & Doce de Leite',
    description: 'Fatias generosas de banana nanica caramelizadas, doce de leite artesanal de Minas e canela em pó polvilhada na hora.',
    base_price: 49.90,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: [
      { id: 'opt-11', menu_item_id: 'item-104', option_group: 'Tamanho', name: 'Média (6 fatias)', price_delta: 0 },
      { id: 'opt-12', menu_item_id: 'item-104', option_group: 'Adicionais', name: 'Bola de Sorvete de Creme', price_delta: 9.00 }
    ]
  },
  {
    id: 'item-105',
    pizzeria_id: 'piz-123',
    category_id: 'cat-4',
    name: 'Refrigerante Coca-Cola Original 2L',
    description: 'Garrafa pet 2 litros gelada.',
    base_price: 14.00,
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: []
  }
]

class MenuStore {
  private categories: MenuCategory[] = []
  private items: MenuItem[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    const savedCats = localStorage.getItem('pizzahub_menu_categories')
    const savedItems = localStorage.getItem('pizzahub_menu_items')

    if (savedCats && savedItems) {
      try {
        this.categories = JSON.parse(savedCats)
        this.items = JSON.parse(savedItems)
      } catch (e) {
        this.categories = initialCategories
        this.items = initialItems
      }
    } else {
      this.categories = initialCategories
      this.items = initialItems
      this.save()
    }
  }

  private save() {
    localStorage.setItem('pizzahub_menu_categories', JSON.stringify(this.categories))
    localStorage.setItem('pizzahub_menu_items', JSON.stringify(this.items))
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

  public getCategories(): MenuCategory[] {
    return [...this.categories].sort((a, b) => a.sort_order - b.sort_order)
  }

  public getItems(categoryId?: string): MenuItem[] {
    if (categoryId && categoryId !== 'all') {
      return this.items.filter((i) => i.category_id === categoryId)
    }
    return [...this.items]
  }

  public getItemById(id: string): MenuItem | undefined {
    return this.items.find((i) => i.id === id)
  }

  // Categorias
  public async createCategory(name: string): Promise<MenuCategory> {
    const newCat: MenuCategory = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      pizzeria_id: 'piz-123',
      name: name.trim(),
      sort_order: this.categories.length + 1
    }

    try {
      await supabase.from('menu_categories').insert(newCat)
    } catch (e) {}

    this.categories.push(newCat)
    this.save()
    return newCat
  }

  public async updateCategory(id: string, name: string): Promise<void> {
    const cat = this.categories.find((c) => c.id === id)
    if (cat) {
      cat.name = name.trim()
      try {
        await supabase.from('menu_categories').update({ name: cat.name }).eq('id', id)
      } catch (e) {}
      this.save()
    }
  }

  public async deleteCategory(id: string): Promise<void> {
    this.categories = this.categories.filter((c) => c.id !== id)
    this.items = this.items.filter((i) => i.category_id !== id)
    try {
      await supabase.from('menu_categories').delete().eq('id', id)
    } catch (e) {}
    this.save()
  }

  // Itens
  public async createItem(data: {
    category_id: string
    name: string
    description: string
    base_price: number
    image_url?: string
  }): Promise<MenuItem> {
    const newItem: MenuItem = {
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      pizzeria_id: 'piz-123',
      category_id: data.category_id,
      name: data.name.trim(),
      description: data.description.trim(),
      base_price: Number(data.base_price),
      image_url: data.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      is_available: true,
      created_at: new Date().toISOString(),
      options: []
    }

    try {
      await supabase.from('menu_items').insert({
        id: newItem.id,
        pizzeria_id: newItem.pizzeria_id,
        category_id: newItem.category_id,
        name: newItem.name,
        description: newItem.description,
        base_price: newItem.base_price,
        image_url: newItem.image_url,
        is_available: newItem.is_available
      })
    } catch (e) {}

    this.items.unshift(newItem)
    this.save()
    return newItem
  }

  public async updateItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    const item = this.items.find((i) => i.id === id)
    if (item) {
      Object.assign(item, updates)
      try {
        await supabase.from('menu_items').update(updates).eq('id', id)
      } catch (e) {}
      this.save()
    }
  }

  public async toggleAvailability(id: string): Promise<boolean> {
    const item = this.items.find((i) => i.id === id)
    if (!item) return false
    item.is_available = !item.is_available

    try {
      await supabase.from('menu_items').update({ is_available: item.is_available }).eq('id', id)
    } catch (e) {}

    this.save()
    return item.is_available
  }

  public async deleteItem(id: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id)
    try {
      await supabase.from('menu_items').delete().eq('id', id)
    } catch (e) {}
    this.save()
  }

  // Opções / Complementos (Tamanho, Borda, Adicionais)
  public async addOption(
    itemId: string,
    optionGroup: string,
    name: string,
    priceDelta: number
  ): Promise<MenuItemOption> {
    const item = this.items.find((i) => i.id === itemId)
    if (!item) throw new Error('Item não encontrado.')

    if (!item.options) item.options = []

    const newOpt: MenuItemOption = {
      id: 'opt-' + Math.random().toString(36).substring(2, 9),
      menu_item_id: itemId,
      option_group: optionGroup,
      name: name.trim(),
      price_delta: Number(priceDelta)
    }

    try {
      await supabase.from('menu_item_options').insert(newOpt)
    } catch (e) {}

    item.options.push(newOpt)
    this.save()
    return newOpt
  }

  public async deleteOption(itemId: string, optionId: string): Promise<void> {
    const item = this.items.find((i) => i.id === itemId)
    if (item && item.options) {
      item.options = item.options.filter((o) => o.id !== optionId)
      try {
        await supabase.from('menu_item_options').delete().eq('id', optionId)
      } catch (e) {}
      this.save()
    }
  }

  // Upload para Supabase Storage (bucket menu-images)
  public async uploadItemImage(file: File): Promise<string> {
    try {
      const ext = file.name.split('.').pop()
      const path = `menu/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`

      const { data, error } = await supabase.storage.from('menu-images').upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

      if (error) {
        console.warn('Storage upload falhou, gerando data URL local:', error)
        return URL.createObjectURL(file)
      }

      const { data: publicData } = supabase.storage.from('menu-images').getPublicUrl(data.path)
      return publicData.publicUrl
    } catch (e) {
      return URL.createObjectURL(file)
    }
  }

  public resetToDefault() {
    this.categories = initialCategories
    this.items = initialItems
    this.save()
  }
}

export const menuService = new MenuStore()
