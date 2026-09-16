import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { settingsService, ChannelConfig } from '@/services/settingsService'
import {
  Share2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Key,
  Globe,
  MessageSquare,
  Smartphone,
  Server,
  Zap,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Save,
  Radio
} from 'lucide-react'

export const SettingsChannels: React.FC = () => {
  const [channels, setChannels] = useState<ChannelConfig[]>(settingsService.getChannels())
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null)
  const [editingCreds, setEditingCreds] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    const unsub = settingsService.subscribe(() => {
      setChannels(settingsService.getChannels())
    })
    return unsub
  }, [])

  const handleToggleActive = async (ch: ChannelConfig) => {
    await settingsService.updateChannel(ch.id, { is_active: !ch.is_active })
  }

  const handleTestConnection = async (id: string) => {
    setTestingId(id)
    setTestResult(null)
    try {
      const res = await settingsService.testChannelConnection(id)
      setTestResult({ id, success: res.success, message: res.message })
      setTimeout(() => setTestResult(null), 5000)
    } finally {
      setTestingId(null)
    }
  }

  const handleSaveCredentials = async (ch: ChannelConfig) => {
    const creds = editingCreds[ch.id]
    if (creds) {
      await settingsService.updateChannel(ch.id, {
        credentials: { ...ch.credentials, ...creds }
      })
      alert(`Credenciais de ${ch.display_name} salvas com sucesso no cofre seguro!`)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'ifood':
      case '99food':
      case 'keeta':
        return <Globe className="w-5 h-5 text-amber-400" />
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />
      case 'own_site':
        return <Smartphone className="w-5 h-5 text-purple-400" />
      case 'pdv':
        return <Server className="w-5 h-5 text-blue-400" />
      default:
        return <Share2 className="w-5 h-5 text-slate-400" />
    }
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Canais & Integrações
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Cofre Seguro Ativo
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Conexão oficial com iFood, 99Food, Keeta, WhatsApp (Evolution API), Site Próprio e PDV
              </p>
            </div>
          </div>

          <button
            onClick={() => settingsService.resetToDefault()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Resetar configurações de canais"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Banner de Segurança */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            Todas as credenciais de API são protegidas via <strong>Supabase Vault</strong> com criptografia de ponta a ponta e processamento isolado via Edge Functions de retaguarda.
          </span>
        </div>

        {/* Grid de Canais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {channels.map((ch) => {
            const isConn = ch.integration_status === 'connected'
            const isTesting = testingId === ch.id
            const currentCreds = editingCreds[ch.id] || ch.credentials

            return (
              <div
                key={ch.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700/80 transition"
              >
                {/* Topo do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {getChannelIcon(ch.channel_type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{ch.display_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            isConn ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isConn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                            }`}
                          />
                          {isConn ? 'Conectado & Sincronizando' : 'Desconectado'}
                        </span>
                        {ch.last_sync_at && (
                          <span className="text-[10px] text-slate-500">
                            • Sync recente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Ativo */}
                  <button
                    onClick={() => handleToggleActive(ch)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      ch.is_active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {ch.is_active ? 'Canal Ativo' : 'Pausado'}
                  </button>
                </div>

                {/* Feedback de Teste */}
                {testResult && testResult.id === ch.id && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-950/60 border-red-500/40 text-red-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Campos de Credenciais */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Parâmetros de Conexão
                  </span>
                  {Object.entries(currentCreds).map(([key, val]) => (
                    <div key={key}>
                      <label className="text-[11px] text-slate-400 block mb-0.5 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type={key.includes('key') || key.includes('token') || key.includes('secret') ? 'password' : 'text'}
                        value={val}
                        onChange={(e) =>
                          setEditingCreds({
                            ...editingCreds,
                            [ch.id]: { ...currentCreds, [key]: e.target.value }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition font-mono"
                      />
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleTestConnection(ch.id)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <Radio className={`w-3.5 h-3.5 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
                  </button>

                  <button
                    onClick={() => handleSaveCredentials(ch)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
