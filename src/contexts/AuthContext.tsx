import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'owner_manager' | 'attendant' | 'kitchen'

export interface PizzeriaInfo {
  id: string
  name: string
  cnpj: string
}

export interface Profile {
  id: string
  pizzeria_id: string
  full_name: string
  role: UserRole
  active: boolean
  created_at: string
  pizzerias?: PizzeriaInfo
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  pizzeria: PizzeriaInfo | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<Profile>
  signInDemo: (role: UserRole) => Promise<Profile>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  pizzeria: null,
  loading: true,
  signIn: async () => { throw new Error('Not implemented') },
  signInDemo: async () => { throw new Error('Not implemented') },
  signOut: async () => {},
  resetPassword: async () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pizzeria, setPizzeria] = useState<PizzeriaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Carrega sessão salva no localStorage se for modo demo ou Supabase
  useEffect(() => {
    const checkSession = async () => {
      // 1. Verifica demo persistido
      const demoAuth = localStorage.getItem('pizzahub_demo_auth')
      if (demoAuth) {
        try {
          const parsed = JSON.parse(demoAuth)
          setProfile(parsed.profile)
          setPizzeria(parsed.pizzeria)
          setUser({ id: parsed.profile.id, email: parsed.email } as User)
          setLoading(false)
          return
        } catch (e) {
          localStorage.removeItem('pizzahub_demo_auth')
        }
      }

      // 2. Verifica sessão Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (e) {
        console.warn('Supabase auth offline ou não configurado ainda:', e)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else if (!localStorage.getItem('pizzahub_demo_auth')) {
        setProfile(null)
        setPizzeria(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, pizzerias(id, name, cnpj)')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      const prof = data as Profile
      setProfile(prof)
      if (data.pizzerias) {
        setPizzeria(data.pizzerias)
      }
      return prof
    } catch (e) {
      console.error('Erro ao buscar profile no Supabase:', e)
      return null
    }
  }

  const signIn = async (email: string, password: string): Promise<Profile> => {
    localStorage.removeItem('pizzahub_demo_auth')

    // 1. Autenticação no Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error(error.message === 'Invalid login credentials' ? 'Email ou senha inválidos.' : error.message)
    }

    if (!data.user) {
      throw new Error('Falha ao autenticar usuário.')
    }

    // 2. Vínculo e checagem de perfil interno
    const prof = await fetchProfile(data.user.id)
    if (!prof) {
      await supabase.auth.signOut()
      throw new Error('Perfil de funcionário não encontrado para este usuário. Fale com o gerente.')
    }

    // 3. Checagem de status ativo
    if (!prof.active) {
      await supabase.auth.signOut()
      throw new Error('Conta inativa — fale com o gerente.')
    }

    return prof
  }

  // Permite login de demonstração instantâneo para testar os papéis caso o Supabase não esteja conectado
  const signInDemo = async (role: UserRole): Promise<Profile> => {
    const demoProfiles: Record<UserRole, Profile> = {
      owner_manager: {
        id: 'usr-owner-1',
        pizzeria_id: 'piz-123',
        full_name: 'Ricardo (Dono/Gerente)',
        role: 'owner_manager',
        active: true,
        created_at: new Date().toISOString(),
        pizzerias: { id: 'piz-123', name: 'Pizzaria Bella Napoli', cnpj: '12.345.678/0001-90' }
      },
      attendant: {
        id: 'usr-attendant-1',
        pizzeria_id: 'piz-123',
        full_name: 'Júlia (Atendente)',
        role: 'attendant',
        active: true,
        created_at: new Date().toISOString(),
        pizzerias: { id: 'piz-123', name: 'Pizzaria Bella Napoli', cnpj: '12.345.678/0001-90' }
      },
      kitchen: {
        id: 'usr-kitchen-1',
        pizzeria_id: 'piz-123',
        full_name: 'Marcos (Cozinha/Produção)',
        role: 'kitchen',
        active: true,
        created_at: new Date().toISOString(),
        pizzerias: { id: 'piz-123', name: 'Pizzaria Bella Napoli', cnpj: '12.345.678/0001-90' }
      }
    }

    const selected = demoProfiles[role]
    localStorage.setItem('pizzahub_demo_auth', JSON.stringify({
      profile: selected,
      pizzeria: selected.pizzerias,
      email: `${role}@pizzahub.com`
    }))

    setProfile(selected)
    setPizzeria(selected.pizzerias || null)
    setUser({ id: selected.id, email: `${role}@pizzahub.com` } as User)
    return selected
  }

  const signOut = async () => {
    localStorage.removeItem('pizzahub_demo_auth')
    try {
      await supabase.auth.signOut()
    } catch (e) {}
    setUser(null)
    setSession(null)
    setProfile(null)
    setPizzeria(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    })
    if (error) throw new Error(error.message)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, pizzeria, loading, signIn, signInDemo, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
