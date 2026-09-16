import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import {
  Pizza,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  ChefHat,
  Headphones,
  ArrowRight
} from 'lucide-react'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signInDemo } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Esqueci minha senha
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const { resetPassword } = useAuth()

  const redirectByRole = (role: UserRole) => {
    const from = (location.state as any)?.from?.pathname
    if (from && from !== '/login') {
      navigate(from, { replace: true })
      return
    }

    if (role === 'kitchen') {
      navigate('/kitchen-queue', { replace: true })
    } else {
      navigate('/unified-orders', { replace: true })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMsg('Por favor, digite seu e-mail de funcionário.')
      return
    }

    if (!password) {
      setErrorMsg('Por favor, digite sua senha de acesso.')
      return
    }

    setLoading(true)
    try {
      const profile = await signIn(trimmedEmail, password)
      redirectByRole(profile.role)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao efetuar login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const prof = await signInDemo(role)
      redirectByRole(prof.role)
    } catch (err: any) {
      setErrorMsg('Falha no login de demonstração.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    if (!forgotEmail.trim()) {
      setForgotError('Informe seu e-mail cadastrado.')
      return
    }

    setForgotLoading(true)
    try {
      await resetPassword(forgotEmail.trim())
      setForgotSuccess(true)
    } catch (err: any) {
      setForgotError(err.message || 'Não foi possível enviar o link de recuperação.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Detalhes de iluminação de fundo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Cabeçalho do Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 shadow-xl shadow-orange-500/20 mb-1">
            <Pizza className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">PizzaHub</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Central de Pedidos e IA — Acesso da Equipe Interna
          </p>
        </div>

        {/* Card Principal de Login */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40 space-y-6">
          {/* Alerta de Erro */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>E-mail profissional</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gerente@pizzaria.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Senha de acesso</label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] text-orange-400 hover:text-orange-300 font-medium transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Seletor de Demonstração Rápida (Para testar os 3 papéis sem necessidade de Auth ativa) */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Testar por Papel de Equipe:</span>
              <span className="text-[10px] text-orange-400/80 uppercase tracking-wider font-mono">Modo Rápido</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('owner_manager')}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-orange-500/10 border border-slate-800 hover:border-orange-500/30 text-slate-300 hover:text-orange-300 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all"
                title="Dono/Gerente: Acesso total a relatórios, cardápio, estoque e configurações"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                <span>Gerente</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('attendant')}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all"
                title="Atendente: Aceite de pedidos unificados e atendimento no WhatsApp"
              >
                <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atendente</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('kitchen')}
                disabled={loading}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-blue-500/10 border border-slate-800 hover:border-blue-500/30 text-slate-300 hover:text-blue-300 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all"
                title="Cozinha: Visualização da fila de produção e botão marcar pronto"
              >
                <ChefHat className="w-3.5 h-3.5 text-blue-400" />
                <span>Cozinha</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo (Regra de Negócio: sem cadastro público) */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
            <span>Não tem conta de funcionário?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            Este painel é de uso exclusivo da equipe interna. Contas são criadas pelo <strong>Dono/Gerente</strong> da pizzaria em Configurações › Equipe.
          </p>
        </div>
      </div>

      {/* Modal: Esqueci minha senha */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="space-y-1 text-center">
              <h3 className="text-base font-bold text-white">Recuperação de Senha</h3>
              <p className="text-xs text-slate-400">
                Informe o seu e-mail cadastrado para enviarmos um link de redefinição de acesso via Supabase Auth.
              </p>
            </div>

            {forgotSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 text-emerald-300">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p className="text-xs font-semibold">Link de recuperação enviado!</p>
                <p className="text-[11px] text-slate-400">
                  Verifique sua caixa de entrada e spam.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(false)
                    setForgotSuccess(false)
                  }}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-slate-800 text-xs text-white hover:bg-slate-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                {forgotError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    {forgotError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Seu e-mail</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@pizzaria.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
