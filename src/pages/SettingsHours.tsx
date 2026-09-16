import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { settingsService, OperatingHourDay } from '@/services/settingsService'
import {
  Clock,
  CheckCircle2,
  Save,
  RotateCcw,
  DollarSign,
  Flame,
  Truck,
  Calendar
} from 'lucide-react'

export const SettingsHours: React.FC = () => {
  const [hours, setHours] = useState<OperatingHourDay[]>(settingsService.getOperatingHours())
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    const unsub = settingsService.subscribe(() => {
      setHours(settingsService.getOperatingHours())
    })
    return unsub
  }, [])

  const handleUpdateDay = (index: number, updates: Partial<OperatingHourDay>) => {
    const updated = [...hours]
    updated[index] = { ...updated[index], ...updates }
    setHours(updated)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await settingsService.updateOperatingHours(hours)
    setFeedback('Horários de funcionamento e taxas salvos com sucesso!')
    setTimeout(() => setFeedback(null), 4000)
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 text-slate-100">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Horários de Funcionamento & Taxas
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Defina o expediente semanal, tempo médio de preparo da cozinha e taxa de entrega dos canais próprios (WhatsApp e site)
              </p>
            </div>
          </div>

          <button
            onClick={() => settingsService.resetToDefault()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Resetar horários para os padrões"
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
          {/* Tabela de Dias da Semana */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Grade de Horários Semanais
              </span>
              <span className="text-[11px] text-slate-500">
                Os pedidos fora do expediente serão pausados ou agendados pela IA
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {hours.map((day, idx) => (
                <div
                  key={day.weekday}
                  className={`p-4 flex flex-wrap items-center justify-between gap-4 transition ${
                    day.is_closed ? 'bg-slate-950/40 opacity-75' : 'hover:bg-slate-800/20'
                  }`}
                >
                  {/* Nome do dia & Toggle */}
                  <div className="w-44 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!day.is_closed}
                      onChange={(e) =>
                        handleUpdateDay(idx, { is_closed: !e.target.checked })
                      }
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-white block">
                        {day.day_name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          day.is_closed ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {day.is_closed ? 'Fechado' : 'Aberto'}
                      </span>
                    </div>
                  </div>

                  {/* Horário de Abertura e Fechamento */}
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Abertura</label>
                      <input
                        type="time"
                        disabled={day.is_closed}
                        value={day.open_time}
                        onChange={(e) => handleUpdateDay(idx, { open_time: e.target.value })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <span className="text-slate-500 text-xs mt-3">até</span>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Fechamento</label>
                      <input
                        type="time"
                        disabled={day.is_closed}
                        value={day.close_time}
                        onChange={(e) => handleUpdateDay(idx, { close_time: e.target.value })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Tempo Médio de Preparo */}
                  <div className="w-36">
                    <label className="text-[10px] text-slate-500 block mb-0.5">Tempo Preparo</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        disabled={day.is_closed}
                        value={day.avg_prep_minutes}
                        onChange={(e) =>
                          handleUpdateDay(idx, { avg_prep_minutes: Number(e.target.value) })
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-slate-400">min</span>
                    </div>
                  </div>

                  {/* Taxa de Entrega */}
                  <div className="w-36">
                    <label className="text-[10px] text-slate-500 block mb-0.5">Taxa de Entrega</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">R$</span>
                      <input
                        type="number"
                        step="0.50"
                        disabled={day.is_closed}
                        value={day.delivery_fee}
                        onChange={(e) =>
                          handleUpdateDay(idx, { delivery_fee: Number(e.target.value) })
                        }
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Horários & Taxas</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
