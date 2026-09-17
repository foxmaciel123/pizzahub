import { Pizza, Candy, CupSoda } from 'lucide-react'
import { MenuItem } from '@/services/menuService'

const MEAT_KEYWORDS = [
  'calabresa', 'bacon', 'frango', 'carne', 'presunto', 'pepperoni',
  'peperoni', 'linguiça', 'atum', 'camarão', 'lombo', 'salame'
]

export const isVegetariana = (item: MenuItem) => {
  const text = `${item.name} ${item.description}`.toLowerCase()
  return !MEAT_KEYWORDS.some((k) => text.includes(k))
}

export const hasMultipleSizes = (item: MenuItem) =>
  (item.options || []).filter((o) => o.option_group === 'Tamanho').length > 1

export const getIngredientChips = (description: string) =>
  description
    .replace(/\.$/, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)

export const getCategoryIcon = (categoryName: string) => {
  const n = categoryName.toLowerCase()
  if (n.includes('doce')) return Candy
  if (n.includes('bebida')) return CupSoda
  return Pizza
}

export const FEATURED_LABELS = ['Mais Pedida', 'Favorito da Casa', 'Recomendado do Chef']
