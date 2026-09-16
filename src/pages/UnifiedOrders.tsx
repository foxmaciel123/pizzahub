import React from 'react'
import { AppLayout } from '@/layouts/AppLayout'

export const UnifiedOrders: React.FC = () => {
  const pageContent = (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Tela Unificada de Pedidos</h1>
        <p className="text-xs text-slate-400 mt-1">Rota: <code className="text-orange-400">/unified-orders</code> • Papel: <span className="text-slate-300 font-semibold">Atendente / Gerente</span></p>
      </div>

      <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
          🍕
        </div>
        <h3 className="text-base font-semibold text-white">Esqueleto da Página Inicializado</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Estrutura base pronta conforme <code>docs/PAGINAS.md</code>. A funcionalidade operacional completa será construída na Fase 2 do <code>docs/PLANO.md</code>.
        </p>
      </div>
    </div>
  )

  return <AppLayout>{pageContent}</AppLayout>
}
