import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { settingsService, AiConfig } from '@/services/settingsService'
import {
  Bot,
  Sparkles,
  MessageSquare,
  Boxes,
  CheckCircle2,
  Save,
  RotateCcw,
  Clock,
  Sliders,
  HelpCircle,
  Pizza
} from 'lucide-react'

export const SettingsAi: React.FC = () => {
  const [config, setConfig] = useState<AiConfig>(settingsService.getAiSettings())
  const [tonePreset, setTonePreset] = useState<string>('amigável e vendedor')
  const [customTone, setCustomTone] = useState<string>('')
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const unsub = settingsService.subscribe(() => {
      const c = settingsService.getAiSettings()
      setConfig(c)
      if (['amigável e vendedor', 'formal e ágil', 'descontraído e jovem'].includes(c.whatsapp_tone)) {
        setTonePreset(c.whatsapp_tone)
      } else {
        setTonePreset('personalizado')
        setCustomTone(c.whatsapp_tone)
      }
    })
    return unsub
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalTone = tonePreset === 'personalizado' ? customTone : tonePreset
    await settingsService.updateAiSettings({
      ...config,
      whatsapp_tone: finalTone
    })
    setFeedback('Configurações da IA atualizadas com sucesso!')
    setTimeout(() => setFeedback(null), 4000)
  }

  const availableItemsToSuggest = [
    { id: 'opt-borda-catupiry', name: 'Borda Vulcão de Catupiry Original (+R$ 14,00)' },
    { id: 'opt-borda-cheddar', name: 'Borda Vulcão de Cheddar Cremoso (+R$ 12,00)' },
    { id: 'item-coca-2l', name: 'Refrigerante Coca-Cola 2L Gelada (R$ 14,00)' },
    { id: 'item-guarana-2l', name: 'Refrigerante Guaraná Antarctica 2L (R$ 12,00)' },
    { id: 'item-pizza-doce', name: 'Pizza Broto Doce de Nutella com Morango (R$ 38,00)' }
  ]

  const handleToggleItem = (itemId: string) => {
    const current = config.suggested_item_ids || []
    const updated = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId]
    setConfig({ ...config, suggested_item_ids: updated })
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 text-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Configuração da Inteligência Artificial
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Claude Haiku 4.5 & Gemini
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Personalize o tom de voz do atendimento no WhatsApp, regras de sugestão de vendas e prazos de alerta
              </p>
            </div>
          </div>

          <button
            onClick={() => settingsService.resetToDefault()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Restaurar padrões de fábrica da IA"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Seção 1: Tom de Voz no WhatsApp */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Tom de Voz no Atendimento do WhatsApp
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              Define a personalidade e o estilo de linguagem empregado pela IA ao dialogar com os clientes no WhatsApp.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'amigável e vendedor',
                  title: 'Amigável & Vendedor',
                  desc: 'Acolhedor, usa emojis moderados e sugere bordas e bebidas ativamente.'
                },
                {
                  id: 'formal e ágil',
                  title: 'Formal & Ágil',
                  desc: 'Direto ao ponto, educado e focado na rapidez de fechamento do pedido.'
                },
                {
                  id: 'descontraído e jovem',
                  title: 'Descontraído & Leve',
                  desc: 'Tom moderno e espontâneo, ideal para público jovem e moderno.'
                }
              ].map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => setTonePreset(preset.id)}
                  className={`p-4 rounded-xl text-left border transition ${
                    tonePreset === preset.id
                      ? 'bg-purple-950/60 border-purple-500/50 shadow-md shadow-purple-950/30'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="font-bold text-xs text-white block mb-1">
                    {preset.title}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-snug block">
                    {preset.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Opção personalizada */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
                <input
                  type="radio"
                  name="tone"
                  checked={tonePreset === 'personalizado'}
                  onChange={() => setTonePreset('personalizado')}
                  className="accent-purple-500"
                />
                <span>Instrução de Tom Personalizada</span>
              </label>

              {tonePreset === 'personalizado' && (
                <textarea
                  rows={2}
                  placeholder="Ex: Fale como um pizzaiolo italiano tradicional apaixonado por gastronomia..."
                  value={customTone}
                  onChange={(e) => setCustomTone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
                />
              )}
            </div>
          </div>

          {/* Seção 2: Sugestão de Itens (Upsell) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Pizza className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Sugestão Automática de Itens (Upsell)
                </h3>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.suggestion_enabled}
                  onChange={(e) =>
                    setConfig({ ...config, suggestion_enabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-xs font-semibold text-white">
                  {config.suggestion_enabled ? 'Sugestões Ativadas' : 'Desativadas'}
                </span>
              </label>
            </div>

            <p className="text-xs text-slate-400">
              Selecione quais itens complementares a IA terá prioridade em oferecer durante o atendimento para elevar o ticket médio:
            </p>

            <div className="space-y-2">
              {availableItemsToSuggest.map((it) => {
                const isChecked = config.suggested_item_ids?.includes(it.id)
                return (
                  <label
                    key={it.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                      isChecked
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!config.suggestion_enabled}
                      onChange={() => handleToggleItem(it.id)}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="text-xs font-medium">{it.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Seção 3: Previsão de Estoque */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Boxes className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Previsão de Estoque & Antecedência de Alerta
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Antecedência do Alerta de Esgotamento: <strong>{config.stock_alert_lead_hours} horas</strong>
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  A IA gerará um alerta no painel se calcular que o insumo atingirá o estoque mínimo dentro desta quantidade de horas.
                </p>
                <input
                  type="range"
                  min={6}
                  max={72}
                  step={6}
                  value={config.stock_alert_lead_hours}
                  onChange={(e) =>
                    setConfig({ ...config, stock_alert_lead_hours: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>6h (Crítico)</span>
                  <span>24h (Padrão)</span>
                  <span>48h</span>
                  <span>72h (3 dias)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <span className="font-semibold text-slate-200 block">Como a IA calcula:</span>
                <p>• Analisa a média de pedidos por hora dos últimos 3 dias.</p>
                <p>• Multiplica pelo fator de consumo de cada receita de pizza.</p>
                <p>• Estima exatamente a data e hora em que a ruptura acontecerá.</p>
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações da IA</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
