import React from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { MessageSquare, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'

export const WhatsappInbox: React.FC = () => {

  return (
    <AppLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link to="/unified-orders" className="hover:text-orange-400 transition-colors">PizzaHub</Link>
              <span>/</span>
              <span className="text-orange-400 font-medium">WhatsApp Inbox & Atendimento IA</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <MessageSquare className="w-6 h-6 text-orange-500 shrink-0" />
              <span>WhatsApp Inbox & Atendimento IA</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Central de conversas automatizadas por IA com suporte a intervenção humana imediata.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              /whatsapp-inbox
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              Dono / Gerente • Atendente
            </span>
          </div>
        </div>

        {/* Phase 1 Status Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Layout Base Navegável Pronto</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">Fase 1 OK</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Esta tela faz parte da arquitetura inicial do PizzaHub. A lógica operacional e integração com Supabase serão ativadas na Fase 2.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rota Protegida</span>
            </span>
          </div>
        </div>

        {/* Feature Cards Grid (Future Scope from docs/ESTRUTURA.md & docs/PAGINAS.md) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Módulos Planejados para esta Tela (Fase 2)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div key="0" className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-orange-500/10 text-orange-400 font-mono text-[10px] flex items-center justify-center font-bold">1</span>
                <span>Atendimento com IA</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">Agente IA tira dúvidas, apresenta o cardápio e monta o pedido em linguagem natural.
              </p>
            </div>
            <div key="1" className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-orange-500/10 text-orange-400 font-mono text-[10px] flex items-center justify-center font-bold">2</span>
                <span>Intervenção Humana (Takeover)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">Sinalização clara quando a IA precisa de suporte humano em casos especiais ou reclamações.
              </p>
            </div>
            <div key="2" className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-orange-500/10 text-orange-400 font-mono text-[10px] flex items-center justify-center font-bold">3</span>
                <span>Carrinho em Tempo Real</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">Acompanhamento do carrinho montado pelo cliente durante a conversa.
              </p>
            </div>
          </div>
        </div>

        {/* Informações de Acesso e Papéis */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>Nível de Acesso: <strong>Dono / Gerente, Atendente</strong></span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">PizzaHub v0.1 • docs/PAGINAS.md</span>
        </div>
      </div>
    </AppLayout>
  )
}
