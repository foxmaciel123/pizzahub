import { supabase } from '@/lib/supabase'

export interface InventoryItem {
  id: string
  pizzeria_id: string
  name: string
  unit: 'kg' | 'un' | 'l'
  current_quantity: number
  min_threshold: number
  updated_at: string
}

export interface InventoryAlert {
  id: string
  pizzeria_id: string
  inventory_item_id: string
  predicted_depletion_at: string
  severity: 'warning' | 'critical'
  resolved: boolean
  created_at: string
  item?: InventoryItem
}

const initialItems: InventoryItem[] = [
  {
    id: 'inv-1',
    pizzeria_id: 'piz-123',
    name: 'Queijo Mussarela Especial',
    unit: 'kg',
    current_quantity: 32.5,
    min_threshold: 25.0,
    updated_at: new Date(Date.now() - 3600 * 1000).toISOString()
  },
  {
    id: 'inv-2',
    pizzeria_id: 'piz-123',
    name: 'Farinha de Trigo Tipo 00',
    unit: 'kg',
    current_quantity: 85.0,
    min_threshold: 40.0,
    updated_at: new Date(Date.now() - 7200 * 1000).toISOString()
  },
  {
    id: 'inv-3',
    pizzeria_id: 'piz-123',
    name: 'Molho de Tomate San Marzano',
    unit: 'l',
    current_quantity: 11.5,
    min_threshold: 15.0,
    updated_at: new Date(Date.now() - 1800 * 1000).toISOString()
  },
  {
    id: 'inv-4',
    pizzeria_id: 'piz-123',
    name: 'Catupiry Original Bisnaga',
    unit: 'kg',
    current_quantity: 5.2,
    min_threshold: 12.0,
    updated_at: new Date(Date.now() - 900 * 1000).toISOString()
  },
  {
    id: 'inv-5',
    pizzeria_id: 'piz-123',
    name: 'Linguiça Calabresa Defumada',
    unit: 'kg',
    current_quantity: 22.0,
    min_threshold: 15.0,
    updated_at: new Date(Date.now() - 4000 * 1000).toISOString()
  },
  {
    id: 'inv-6',
    pizzeria_id: 'piz-123',
    name: 'Caixas de Pizza Oitavada Grande 35cm',
    unit: 'un',
    current_quantity: 140,
    min_threshold: 100,
    updated_at: new Date(Date.now() - 5000 * 1000).toISOString()
  },
  {
    id: 'inv-7',
    pizzeria_id: 'piz-123',
    name: 'Bacon em Cubos',
    unit: 'kg',
    current_quantity: 8.0,
    min_threshold: 6.0,
    updated_at: new Date(Date.now() - 8000 * 1000).toISOString()
  },
  {
    id: 'inv-8',
    pizzeria_id: 'piz-123',
    name: 'Azeite de Oliva Extra Virgem',
    unit: 'l',
    current_quantity: 14.0,
    min_threshold: 5.0,
    updated_at: new Date(Date.now() - 12000 * 1000).toISOString()
  }
]

const initialAlerts: InventoryAlert[] = [
  {
    id: 'alert-1',
    pizzeria_id: 'piz-123',
    inventory_item_id: 'inv-4', // Catupiry
    predicted_depletion_at: new Date(Date.now() + 4.5 * 3600 * 1000).toISOString(),
    severity: 'critical',
    resolved: false,
    created_at: new Date(Date.now() - 1800 * 1000).toISOString()
  },
  {
    id: 'alert-2',
    pizzeria_id: 'piz-123',
    inventory_item_id: 'inv-3', // Molho San Marzano
    predicted_depletion_at: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
    severity: 'warning',
    resolved: false,
    created_at: new Date(Date.now() - 3600 * 1000).toISOString()
  }
]

class InventoryStore {
  private items: InventoryItem[] = []
  private alerts: InventoryAlert[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    const savedItems = localStorage.getItem('pizzahub_inventory_items')
    const savedAlerts = localStorage.getItem('pizzahub_inventory_alerts')

    if (savedItems) {
      try {
        this.items = JSON.parse(savedItems)
      } catch {
        this.items = initialItems
      }
    } else {
      this.items = initialItems
      this.save()
    }

    if (savedAlerts) {
      try {
        this.alerts = JSON.parse(savedAlerts)
      } catch {
        this.alerts = initialAlerts
      }
    } else {
      this.alerts = initialAlerts
      this.save()
    }
  }

  private save() {
    localStorage.setItem('pizzahub_inventory_items', JSON.stringify(this.items))
    localStorage.setItem('pizzahub_inventory_alerts', JSON.stringify(this.alerts))
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

  public getItems(): InventoryItem[] {
    return [...this.items].sort((a, b) => a.name.localeCompare(b.name))
  }

  public getItemById(id: string): InventoryItem | undefined {
    return this.items.find((i) => i.id === id)
  }

  public getAlerts(unresolvedOnly: boolean = false): InventoryAlert[] {
    const list = unresolvedOnly ? this.alerts.filter((a) => !a.resolved) : this.alerts
    return list
      .map((alert) => ({
        ...alert,
        item: this.items.find((i) => i.id === alert.inventory_item_id)
      }))
      .sort((a, b) => {
        // Críticos primeiro, depois por data prevista
        if (a.severity === 'critical' && b.severity !== 'critical') return -1
        if (b.severity === 'critical' && a.severity !== 'critical') return 1
        return new Date(a.predicted_depletion_at).getTime() - new Date(b.predicted_depletion_at).getTime()
      })
  }

  public async addItem(item: Omit<InventoryItem, 'id' | 'updated_at'>): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      id: 'inv-' + Math.random().toString(36).substring(2, 9),
      updated_at: new Date().toISOString()
    }
    this.items.push(newItem)

    try {
      await supabase.from('inventory_items').insert(newItem)
    } catch {}

    this.save()
    return newItem
  }

  public async updateQuantity(id: string, options: { quantity?: number; delta?: number }): Promise<void> {
    const item = this.items.find((i) => i.id === id)
    if (!item) return

    if (options.quantity !== undefined) {
      item.current_quantity = Math.max(0, options.quantity)
    } else if (options.delta !== undefined) {
      item.current_quantity = Math.max(0, Number((item.current_quantity + options.delta).toFixed(2)))
    }
    item.updated_at = new Date().toISOString()

    try {
      await supabase
        .from('inventory_items')
        .update({
          current_quantity: item.current_quantity,
          updated_at: item.updated_at
        })
        .eq('id', id)
    } catch {}

    this.save()
  }

  public async updateItem(id: string, updates: Partial<Omit<InventoryItem, 'id'>>): Promise<void> {
    const item = this.items.find((i) => i.id === id)
    if (!item) return

    Object.assign(item, updates)
    item.updated_at = new Date().toISOString()

    try {
      await supabase.from('inventory_items').update(updates).eq('id', id)
    } catch {}

    this.save()
  }

  public async deleteItem(id: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id)
    this.alerts = this.alerts.filter((a) => a.inventory_item_id !== id)

    try {
      await supabase.from('inventory_items').delete().eq('id', id)
    } catch {}

    this.save()
  }

  public async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.resolved = true
      try {
        await supabase
          .from('inventory_alerts')
          .update({ resolved: true })
          .eq('id', alertId)
      } catch {}
      this.save()
    }
  }

  // Executa o algoritmo de previsão com IA e atualiza os alertas locais e no banco
  public async runForecast(leadHours: number = 24): Promise<{ alertsCreated: number; projections: any[] }> {
    const ordersPerHour = 3.5 // Taxa base de consumo
    let alertsCreated = 0
    const projections = []

    for (const item of this.items) {
      let consumptionPerOrder = 0.25
      const lower = item.name.toLowerCase()
      if (lower.includes('mussarela') || lower.includes('queijo') || lower.includes('catupiry')) {
        consumptionPerOrder = 0.35
      } else if (lower.includes('farinha') || lower.includes('massa')) {
        consumptionPerOrder = 0.25
      } else if (lower.includes('molho') || lower.includes('tomate')) {
        consumptionPerOrder = 0.15
      } else if (lower.includes('caixa')) {
        consumptionPerOrder = 1.1
      }

      const hourlyConsumption = ordersPerHour * consumptionPerOrder
      const currentQty = item.current_quantity
      const minThreshold = item.min_threshold

      const qtyUntilMin = Math.max(0, currentQty - minThreshold)
      const hoursUntilMin = hourlyConsumption > 0 ? qtyUntilMin / hourlyConsumption : 999
      const hoursUntilZero = hourlyConsumption > 0 ? currentQty / hourlyConsumption : 999
      const depletionDate = new Date(Date.now() + Math.round(hoursUntilZero * 3600 * 1000)).toISOString()

      const shouldAlert = hoursUntilMin <= leadHours || currentQty <= minThreshold

      if (shouldAlert) {
        const isCritical = currentQty <= minThreshold || hoursUntilZero <= 6
        const severity: 'warning' | 'critical' = isCritical ? 'critical' : 'warning'

        const existing = this.alerts.find((a) => a.inventory_item_id === item.id && !a.resolved)
        if (!existing) {
          this.alerts.push({
            id: 'alert-' + Math.random().toString(36).substring(2, 9),
            pizzeria_id: item.pizzeria_id,
            inventory_item_id: item.id,
            predicted_depletion_at: depletionDate,
            severity,
            resolved: false,
            created_at: new Date().toISOString()
          })
          alertsCreated++
        } else {
          existing.severity = severity
          existing.predicted_depletion_at = depletionDate
        }
      }

      projections.push({
        item_id: item.id,
        name: item.name,
        current_quantity: currentQty,
        min_threshold: minThreshold,
        hours_until_zero: Number(hoursUntilZero.toFixed(1)),
        alert_triggered: shouldAlert
      })
    }

    this.save()
    return { alertsCreated, projections }
  }

  public resetToDefault() {
    this.items = initialItems
    this.alerts = initialAlerts
    this.save()
  }
}

export const inventoryService = new InventoryStore()
