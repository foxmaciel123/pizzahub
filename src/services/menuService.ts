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

// Incrementar sempre que initialCategories/initialItems mudar de conteúdo,
// para que navegadores com o cardápio antigo em cache sejam migrados.
const MENU_SEED_VERSION = 'full-forneria-v1'

const initialCategories: MenuCategory[] = [
  { id: 'cat-1', pizzeria_id: 'piz-123', name: 'Combos', sort_order: 1 },
  { id: 'cat-2', pizzeria_id: 'piz-123', name: 'Pizzas Salgadas', sort_order: 2 },
  { id: 'cat-3', pizzeria_id: 'piz-123', name: 'Pizzas Doces', sort_order: 3 },
  { id: 'cat-4', pizzeria_id: 'piz-123', name: 'Bebidas', sort_order: 4 }
]

// Preços das pizzas avulsas são fictícios (a confirmar com o cliente) —
// os dois combos usam os valores reais informados no briefing.
const initialItems: MenuItem[] = [
  {
    id: 'item-combo-familia',
    pizzeria_id: 'piz-123',
    category_id: 'cat-1',
    name: 'Combo Família',
    description: '2 Pizzas de 40cm, 1 Pizza Doce de 20cm e 1 Guaraná Antarctica 1,5L. Ativo de terça a domingo, das 18h às 23h59.',
    base_price: 139.98,
    image_url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: []
  },
  {
    id: 'item-combo-mais10',
    pizzeria_id: 'piz-123',
    category_id: 'cat-1',
    name: 'Combo +10',
    description: '1 Pizza de 40cm + R$10,00 e você ganha 1 Pizza Doce de 20cm de brinde. Ativo de terça a domingo, das 18h às 23h59.',
    base_price: 64.99,
    image_url: 'https://images.unsplash.com/photo-1571066811602-716837d681de?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: []
  },
  {
    id: 'item-calabresa',
    pizzeria_id: 'piz-123',
    category_id: 'cat-2',
    name: 'Pizza Calabresa',
    description: 'Queijo mussarela, calabresa, cebola e orégano.',
    base_price: 54.90,
    image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: []
  },
  {
    id: 'item-frango-catupiry',
    pizzeria_id: 'piz-123',
    category_id: 'cat-2',
    name: 'Pizza Frango com Catupiry',
    description: 'Frango desfiado, Catupiry e orégano.',
    base_price: 57.90,
    image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: []
  },
  {
    id: 'item-moda-full',
    pizzeria_id: 'piz-123',
    category_id: 'cat-2',
    name: 'Pizza Moda Full',
    description: 'Sabor da casa: mussarela, frango, bacon, cream cheese Philadelphia, um toque de parmesão ralado e orégano.',
    base_price: 62.90,
    image_url: 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: []
  },
  {
    id: 'item-pizza-doce',
    pizzeria_id: 'piz-123',
    category_id: 'cat-3',
    name: 'Pizza Doce 20cm',
    description: 'Consulte o sabor disponível do dia com nosso atendimento.',
    base_price: 34.90,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    created_at: new Date().toISOString(),
    options: []
  },
  {
    id: 'item-guarana',
    pizzeria_id: 'piz-123',
    category_id: 'cat-4',
    name: 'Guaraná Antarctica 1,5L',
    description: 'Garrafa 1,5 litros gelada.',
    base_price: 12.90,
    image_url: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=800&q=80',
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
    const savedSeedVersion = localStorage.getItem('pizzahub_menu_seed_version')

    if (savedCats && savedItems && savedSeedVersion === MENU_SEED_VERSION) {
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
    localStorage.setItem('pizzahub_menu_seed_version', MENU_SEED_VERSION)
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
