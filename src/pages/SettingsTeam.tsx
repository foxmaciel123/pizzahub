import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { settingsService, TeamMember } from '@/services/settingsService'
import {
  Users,
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChefHat,
  Headphones,
  Crown,
  Lock,
  Mail,
  X,
  UserCheck
} from 'lucide-react'

export const SettingsTeam: React.FC = () => {
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner_manager'

  const [members, setMembers] = useState<TeamMember[]>(settingsService.getTeamMembers())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'attendant' as 'owner_manager' | 'attendant' | 'kitchen'
  })
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const unsub = settingsService.subscribe(() => {
      setMembers(settingsService.getTeamMembers())
    })
    return unsub
  }, [])

  // Restrição de Papel
  if (!isOwner) {
    return (
      <AppLayout>
        <div className="p-8 max-w-lg mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Acesso Restrito ao Dono/Gerente</h2>
          <p className="text-sm text-slate-400">
            A gestão de usuários e atribuição de permissões internas é exclusiva para perfis com papel de Dono/Gerente (owner_manager).
          </p>
        </div>
      </AppLayout>
    )
  }

  const handleRoleChange = async (id: string, role: 'owner_manager' | 'attendant' | 'kitchen') => {
    await settingsService.updateTeamMember(id, { role })
    setFeedback('Papel de usuário atualizado!')
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleToggleActive = async (member: TeamMember) => {
    await settingsService.updateTeamMember(member.id, { active: !member.active })
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover ${name} da equipe?`)) {
      await settingsService.deleteTeamMember(id)
      setFeedback('Membro removido da equipe.')
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim() || !formData.email.trim()) return

    await settingsService.addTeamMember({
      pizzeria_id: profile?.pizzeria_id || 'piz-123',
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      active: true
    })

    setFormData({ full_name: '', email: '', role: 'attendant' })
    setIsModalOpen(false)
    setFeedback('Novo membro cadastrado com sucesso!')
    setTimeout(() => setFeedback(null), 4000)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner_manager':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Dono / Gerente
          </span>
        )
      case 'attendant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
            <Headphones className="w-3.5 h-3.5 text-emerald-400" />
            Atendente
          </span>
        )
      case 'kitchen':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-semibold">
            <ChefHat className="w-3.5 h-3.5 text-orange-400" />
            Cozinha / Produção
          </span>
        )
      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 text-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestão da Equipe & Papéis
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Privilégio Gerente
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Controle centralizado de colaboradores com controle granular de acesso (owner_manager, attendant, kitchen)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Convidar Membro</span>
            </button>

            <button
              onClick={() => settingsService.resetToDefault()}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Restaurar equipe padrão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Cards Explicativos de Papéis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Crown className="w-4 h-4" />
              <span>Dono / Gerente (owner_manager)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acesso total ao sistema: configuração de cardápio, horários, relatórios diários e semanais, e controle de equipe.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Headphones className="w-4 h-4" />
              <span>Atendente (attendant)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Opera a tela unificada de pedidos, confirma e avança status, atende no WhatsApp e gerencia estoque.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
              <ChefHat className="w-4 h-4" />
              <span>Cozinha (kitchen)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Foco restrito na fila de produção (/kitchen-queue): confere itens, observações e marca pedidos como prontos.
            </p>
          </div>
        </div>

        {/* Lista de Membros */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Colaboradores Cadastrados ({members.length})
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-800/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-300">
                    {member.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">
                      {member.full_name}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      {member.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Seletor de Papel */}
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as any)
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="owner_manager">Dono / Gerente</option>
                    <option value="attendant">Atendente</option>
                    <option value="kitchen">Cozinha</option>
                  </select>

                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleActive(member)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                      member.active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {member.active ? 'Ativo' : 'Inativo'}
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={() => handleDelete(member.id, member.full_name)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-300 transition"
                    title="Remover membro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Cadastro */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  <span>Cadastrar Membro da Equipe</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roberta Silveira"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    E-mail de Login
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: roberta@pizzahub.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Papel de Acesso
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="attendant">Atendente (Pedidos, WhatsApp, Estoque)</option>
                    <option value="kitchen">Cozinha (Fila de Produção)</option>
                    <option value="owner_manager">Dono / Gerente (Acesso Total)</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
                  >
                    Cadastrar
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
