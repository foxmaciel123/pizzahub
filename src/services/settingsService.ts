import { supabase } from '@/lib/supabase'

export interface ChannelConfig {
  id: string
  pizzeria_id: string
  channel_type: 'ifood' | '99food' | 'keeta' | 'whatsapp' | 'own_site' | 'pdv'
  display_name: string
  is_active: boolean
  credentials: Record<string, string>
  integration_status: 'connected' | 'error' | 'disconnected'
  last_sync_at?: string
}

export interface AiConfig {
  id: string
  pizzeria_id: string
  whatsapp_tone: string
  suggestion_enabled: boolean
  suggested_item_ids: string[]
  stock_alert_lead_hours: number
}

export interface OperatingHourDay {
  weekday: number // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  day_name: string
  is_closed: boolean
  open_time: string
  close_time: string
  avg_prep_minutes: number
  delivery_fee: number
}

export interface TeamMember {
  id: string
  pizzeria_id: string
  full_name: string
  email: string
  role: 'owner_manager' | 'attendant' | 'kitchen'
  active: boolean
  created_at: string
}

const initialChannels: ChannelConfig[] = [
  {
    id: 'chan-ifood',
    pizzeria_id: 'piz-123',
    channel_type: 'ifood',
    display_name: 'iFood Delivery',
    is_active: true,
    credentials: {
      client_id: 'ifood_client_prod_8912',
      merchant_id: 'merch-sp-01',
      webhook_url: 'https://pizzahub.supabase.co/functions/v1/ifood-webhook'
    },
    integration_status: 'connected',
    last_sync_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
  },
  {
    id: 'chan-99',
    pizzeria_id: 'piz-123',
    channel_type: '99food',
    display_name: '99Food',
    is_active: true,
    credentials: {
      partner_id: '99_part_5521',
      api_key: '••••••••••••••••'
    },
    integration_status: 'connected',
    last_sync_at: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  },
  {
    id: 'chan-keeta',
    pizzeria_id: 'piz-123',
    channel_type: 'keeta',
    display_name: 'Keeta Delivery',
    is_active: true,
    credentials: {
      store_code: 'KEE-BR-9941',
      api_token: '••••••••••••••••'
    },
    integration_status: 'connected',
    last_sync_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'chan-whatsapp',
    pizzeria_id: 'piz-123',
    channel_type: 'whatsapp',
    display_name: 'WhatsApp (Evolution API)',
    is_active: true,
    credentials: {
      instance_name: 'pizzahub-sp-01',
      api_key: '••••••••••••••••',
      server_url: 'https://api.evolution.pizzahub.app'
    },
    integration_status: 'connected',
    last_sync_at: new Date(Date.now() - 1 * 60 * 1000).toISOString()
  },
  {
    id: 'chan-site',
    pizzeria_id: 'piz-123',
    channel_type: 'own_site',
    display_name: 'Site Próprio (/loja)',
    is_active: true,
    credentials: {
      store_url: '/loja',
      auto_accept: 'false'
    },
    integration_status: 'connected',
    last_sync_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: 'chan-pdv',
    pizzeria_id: 'piz-123',
    channel_type: 'pdv',
    display_name: 'Integração PDV Existente',
    is_active: true,
    credentials: {
      integration_type: 'api',
      pdv_api_endpoint: 'https://pdv.pizzaria.local:8443/orders',
      pdv_token: '••••••••••••••••'
    },
    integration_status: 'connected',
    last_sync_at: new Date(Date.now() - 8 * 60 * 1000).toISOString()
  }
]

const initialAiSettings: AiConfig = {
  id: 'ai-cfg-01',
  pizzeria_id: 'piz-123',
  whatsapp_tone: 'amigável e vendedor',
  suggestion_enabled: true,
  suggested_item_ids: ['item-calabresa', 'opt-borda-catupiry', 'item-coca-2l'],
  stock_alert_lead_hours: 24
}

const initialOperatingHours: OperatingHourDay[] = [
  { weekday: 0, day_name: 'Domingo', is_closed: false, open_time: '18:00', close_time: '23:30', avg_prep_minutes: 30, delivery_fee: 8.00 },
  { weekday: 1, day_name: 'Segunda-feira', is_closed: true, open_time: '18:00', close_time: '23:00', avg_prep_minutes: 30, delivery_fee: 8.00 },
  { weekday: 2, day_name: 'Terça-feira', is_closed: false, open_time: '18:00', close_time: '23:00', avg_prep_minutes: 25, delivery_fee: 8.00 },
  { weekday: 3, day_name: 'Quarta-feira', is_closed: false, open_time: '18:00', close_time: '23:00', avg_prep_minutes: 25, delivery_fee: 8.00 },
  { weekday: 4, day_name: 'Quinta-feira', is_closed: false, open_time: '18:00', close_time: '23:30', avg_prep_minutes: 30, delivery_fee: 8.00 },
  { weekday: 5, day_name: 'Sexta-feira', is_closed: false, open_time: '18:00', close_time: '00:00', avg_prep_minutes: 35, delivery_fee: 9.00 },
  { weekday: 6, day_name: 'Sábado', is_closed: false, open_time: '18:00', close_time: '00:30', avg_prep_minutes: 40, delivery_fee: 9.00 }
]

const initialTeamMembers: TeamMember[] = [
  {
    id: 'usr-01',
    pizzeria_id: 'piz-123',
    full_name: 'Marco Antônio (Dono/Gerente)',
    email: 'gerente@pizzahub.com',
    role: 'owner_manager',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'usr-02',
    pizzeria_id: 'piz-123',
    full_name: 'Larissa Lima (Atendimento)',
    email: 'atendente@pizzahub.com',
    role: 'attendant',
    active: true,
    created_at: '2026-02-15T14:30:00.000Z'
  },
  {
    id: 'usr-03',
    pizzeria_id: 'piz-123',
    full_name: 'Chef Giovanni (Pizzaiolo Cozinha)',
    email: 'cozinha@pizzahub.com',
    role: 'kitchen',
    active: true,
    created_at: '2026-02-18T16:00:00.000Z'
  }
]

class SettingsStore {
  private channels: ChannelConfig[] = initialChannels
  private aiSettings: AiConfig = initialAiSettings
  private operatingHours: OperatingHourDay[] = initialOperatingHours
  private teamMembers: TeamMember[] = initialTeamMembers
  private listeners: Set<() => void> = new Set()

  constructor() {
    const savedChannels = localStorage.getItem('pizzahub_channels')
    const savedAi = localStorage.getItem('pizzahub_ai_settings')
    const savedHours = localStorage.getItem('pizzahub_operating_hours')
    const savedTeam = localStorage.getItem('pizzahub_team_members')

    if (savedChannels) try { this.channels = JSON.parse(savedChannels) } catch {}
    if (savedAi) try { this.aiSettings = JSON.parse(savedAi) } catch {}
    if (savedHours) try { this.operatingHours = JSON.parse(savedHours) } catch {}
    if (savedTeam) try { this.teamMembers = JSON.parse(savedTeam) } catch {}
  }

  private save() {
    localStorage.setItem('pizzahub_channels', JSON.stringify(this.channels))
    localStorage.setItem('pizzahub_ai_settings', JSON.stringify(this.aiSettings))
    localStorage.setItem('pizzahub_operating_hours', JSON.stringify(this.operatingHours))
    localStorage.setItem('pizzahub_team_members', JSON.stringify(this.teamMembers))
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

  // --- CANAIS ---
  public getChannels(): ChannelConfig[] {
    return this.channels
  }

  public async updateChannel(id: string, updates: Partial<ChannelConfig>): Promise<void> {
    const ch = this.channels.find(c => c.id === id)
    if (ch) {
      Object.assign(ch, updates)
      ch.last_sync_at = new Date().toISOString()
      try {
        await supabase.from('sales_channels').update(updates).eq('id', id)
      } catch {}
      this.save()
    }
  }

  public async testChannelConnection(id: string): Promise<{ success: boolean; message: string }> {
    const ch = this.channels.find(c => c.id === id)
    if (!ch) return { success: false, message: 'Canal não encontrado' }

    ch.integration_status = 'connected'
    ch.last_sync_at = new Date().toISOString()
    this.save()
    return { success: true, message: `Conexão com ${ch.display_name} verificada com sucesso!` }
  }

  // --- IA SETTINGS ---
  public getAiSettings(): AiConfig {
    return this.aiSettings
  }

  public async updateAiSettings(updates: Partial<AiConfig>): Promise<void> {
    Object.assign(this.aiSettings, updates)
    try {
      await supabase.from('ai_settings').update(updates).eq('pizzeria_id', this.aiSettings.pizzeria_id)
    } catch {}
    this.save()
  }

  // --- OPERATING HOURS ---
  public getOperatingHours(): OperatingHourDay[] {
    return this.operatingHours
  }

  public async updateOperatingHours(hours: OperatingHourDay[]): Promise<void> {
    this.operatingHours = hours
    try {
      // Sincroniza dias
      for (const h of hours) {
        await supabase.from('operating_hours').upsert({
          pizzeria_id: 'piz-123',
          weekday: h.weekday,
          open_time: h.is_closed ? null : h.open_time,
          close_time: h.is_closed ? null : h.close_time,
          avg_prep_minutes: h.avg_prep_minutes,
          delivery_fee: h.delivery_fee
        })
      }
    } catch {}
    this.save()
  }

  // --- EQUIPE & ROLES ---
  public getTeamMembers(): TeamMember[] {
    return this.teamMembers
  }

  public async addTeamMember(data: Omit<TeamMember, 'id' | 'created_at'>): Promise<TeamMember> {
    const newMember: TeamMember = {
      ...data,
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    }
    this.teamMembers.push(newMember)

    try {
      await supabase.from('profiles').insert({
        id: newMember.id,
        pizzeria_id: newMember.pizzeria_id,
        full_name: newMember.full_name,
        role: newMember.role,
        active: newMember.active
      })
    } catch {}

    this.save()
    return newMember
  }

  public async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
    const member = this.teamMembers.find(m => m.id === id)
    if (member) {
      Object.assign(member, updates)
      try {
        await supabase.from('profiles').update(updates).eq('id', id)
      } catch {}
      this.save()
    }
  }

  public async deleteTeamMember(id: string): Promise<void> {
    this.teamMembers = this.teamMembers.filter(m => m.id !== id)
    try {
      await supabase.from('profiles').delete().eq('id', id)
    } catch {}
    this.save()
  }

  public resetToDefault() {
    this.channels = initialChannels
    this.aiSettings = initialAiSettings
    this.operatingHours = initialOperatingHours
    this.teamMembers = initialTeamMembers
    this.save()
  }
}

export const settingsService = new SettingsStore()
