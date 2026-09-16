import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  whatsappService,
  WhatsAppConversation,
  WhatsAppMessage
} from '@/services/whatsappService'
import {
  MessageSquare,
  Bot,
  User,
  Phone,
  Send,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Search,
  ExternalLink,
  ArrowRight,
  RotateCcw,
  Zap,
  Info,
  Clock,
  CheckCheck,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  Smartphone
} from 'lucide-react'

export const WhatsappInbox: React.FC = () => {
  const { profile } = useAuth()
  const attendantName = profile?.full_name || 'Atendente'

  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedId, setSelectedId] = useState<string>('conv-001')
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'needs_human' | 'ai' | 'human'>('all')
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showContextPanel, setShowContextPanel] = useState(true)

  // Mensagem simulada do cliente
  const [simulatedText, setSimulatedText] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carrega e sincroniza conversas
  const loadData = () => {
    const list = whatsappService.getConversations()
    setConversations(list)
    if (selectedId) {
      setMessages(whatsappService.getMessages(selectedId))
    }
  }

  useEffect(() => {
    loadData()
    const unsubscribe = whatsappService.subscribe(() => {
      loadData()
    })
    return unsubscribe
  }, [selectedId])

  // Scroll para o fim das mensagens quando a conversa muda ou novas mensagens chegam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentConv = conversations.find((c) => c.id === selectedId)

  // Filtros de conversa
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_phone.includes(searchTerm) ||
      c.last_message_text.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (activeTab === 'needs_human') return c.needs_human
    if (activeTab === 'ai') return c.handled_by === 'ai' && !c.needs_human
    if (activeTab === 'human') return c.handled_by === 'human'
    return true
  })

  // Contadores
  const countNeedsHuman = conversations.filter((c) => c.needs_human).length
  const countAi = conversations.filter((c) => c.handled_by === 'ai' && !c.needs_human).length
  const countHuman = conversations.filter((c) => c.handled_by === 'human').length

  // Assumir atendimento
  const handleTakeover = async () => {
    if (!selectedId) return
    await whatsappService.takeoverConversation(selectedId, attendantName)
  }

  // Devolver atendimento para a IA
  const handleReturnToAi = async () => {
    if (!selectedId) return
    await whatsappService.returnToAi(selectedId)
  }

  // Enviar mensagem do atendente
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim() || !selectedId) return

    setIsSending(true)
    const text = inputText.trim()
    setInputText('')

    // Se estiver com a IA ou precisando de humano, assumir automaticamente ao enviar resposta do atendente
    if (currentConv?.handled_by === 'ai' || currentConv?.needs_human) {
      await whatsappService.takeoverConversation(selectedId, attendantName)
    }

    await whatsappService.sendMessage(selectedId, text, 'attendant')
    setIsSending(false)
  }

  // Enviar mensagem simulada do cliente (ferramenta de teste interativa)
  const handleSimulateClient = async (customText?: string) => {
    const text = customText || simulatedText
    if (!text.trim() || !selectedId) return

    setSimulatedText('')
    await whatsappService.simulateIncomingCustomerMessage(selectedId, text)
  }

  // Atalhos de mensagens prontas do atendente
  const quickReplies = [
    '🍕 Nosso tempo de entrega está entre 35 e 45 minutos.',
    '💳 Aceitamos PIX, Cartão de Crédito e Débito na entrega.',
    '📍 Por favor, confirme seu endereço completo com número e complemento.',
    '✅ Seu pedido já foi enviado para nossa cozinha!'
  ]

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMin = Math.floor(diffMs / 60000)

      if (diffMin < 1) return 'Agora'
      if (diffMin < 60) return `há ${diffMin} min`
      const diffHours = Math.floor(diffMin / 60)
      if (diffHours < 24) return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
    } catch {
      return ''
    }
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4.5rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
        {/* Cabeçalho do Módulo */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Central WhatsApp & Atendimento IA
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Claude Haiku 4.5
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atendimento automático integrado à Evolution API, transbordo inteligente e controle manual pela equipe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {countNeedsHuman > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold animate-pulse shadow-lg shadow-red-950/50">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{countNeedsHuman} aguardando atendente</span>
              </div>
            )}
            <Link
              to="/loja"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              title="Abrir a Loja Pública de Pedidos"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Cardápio Próprio (/loja)</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
            <button
              onClick={() => {
                whatsappService.resetToDefault()
                loadData()
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700 transition"
              title="Resetar conversas de demonstração"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Corpo Principal (3 Colunas) */}
        <div className="flex-1 flex overflow-hidden">
          {/* ======================= COLUNA 1: LISTA DE CONVERSAS ======================= */}
          <div className="w-80 md:w-96 border-r border-slate-800 flex flex-col bg-slate-900/50 shrink-0">
            {/* Barra de Busca */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente, telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Filtros em Abas */}
              <div className="flex gap-1 mt-2.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                    activeTab === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todas ({conversations.length})
                </button>
                <button
                  onClick={() => setActiveTab('needs_human')}
                  className={`flex-1 py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                    activeTab === 'needs_human'
                      ? 'bg-red-950/80 text-red-200 border border-red-500/40 shadow-sm'
                      : 'text-red-400 hover:text-red-300'
                  }`}
                >
                  Humano
                  {countNeedsHuman > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {countNeedsHuman}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                    activeTab === 'ai'
                      ? 'bg-purple-950/80 text-purple-200 border border-purple-500/40 shadow-sm'
                      : 'text-purple-400 hover:text-purple-300'
                  }`}
                >
                  IA ({countAi})
                </button>
                <button
                  onClick={() => setActiveTab('human')}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition ${
                    activeTab === 'human'
                      ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 shadow-sm'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  Assumidas ({countHuman})
                </button>
              </div>
            </div>

            {/* Lista com scroll */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Nenhuma conversa encontrada neste filtro.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedId
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={`w-full text-left p-3.5 transition flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-slate-800/90 border-l-4 border-amber-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            conv.needs_human
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : conv.handled_by === 'ai'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {conv.customer_name.slice(0, 2).toUpperCase()}
                        </div>
                        {conv.needs_human && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-900 animate-ping" />
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-semibold text-xs text-white truncate">
                            {conv.customer_name}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 truncate mb-1.5">
                          {conv.last_message_text}
                        </p>

                        {/* Badges de Status */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {conv.needs_human ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                              <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                              Requer Atendente
                            </span>
                          ) : conv.handled_by === 'ai' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25">
                              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                              IA Claude Haiku
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                              <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
                              Atendente Humano
                            </span>
                          )}

                          {conv.unread_count > 0 && (
                            <span className="ml-auto px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                              {conv.unread_count} nova(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ======================= COLUNA 2: CHAT EM TEMPO REAL ======================= */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {currentConv ? (
              <>
                {/* Header do Chat */}
                <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200">
                      {currentConv.customer_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white">
                          {currentConv.customer_name}
                        </h2>
                        <a
                          href={`https://wa.me/55${currentConv.customer_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                          title="Abrir no WhatsApp Oficial"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{currentConv.customer_phone}</span>
                        </a>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {currentConv.needs_human ? (
                          <span className="text-[11px] text-red-400 flex items-center gap-1 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            Aguardando atendimento humano imediato
                          </span>
                        ) : currentConv.handled_by === 'ai' ? (
                          <span className="text-[11px] text-purple-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Atendimento automático pela IA Claude 4.5
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            Conversa assumida pela equipe da pizzaria
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações de Transbordo */}
                  <div className="flex items-center gap-2">
                    {currentConv.handled_by === 'ai' || currentConv.needs_human ? (
                      <button
                        onClick={handleTakeover}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Assumir Conversa</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleReturnToAi}
                        className="px-3 py-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center gap-1.5 transition transform active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Devolver para IA</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowContextPanel(!showContextPanel)}
                      className={`p-2 rounded-lg border text-xs transition ${
                        showContextPanel
                          ? 'bg-slate-800 border-slate-700 text-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title="Alternar painel lateral de testes e perfil"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Banner de alerta quando precisa de humano */}
                {currentConv.needs_human && (
                  <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border-b border-red-500/30 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-2 text-red-200 text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
                      <span>
                        <strong>Atenção:</strong> O cliente solicitou um atendente ou expressou uma dúvida/reclamação crítica (RS-13 / RS-15).
                      </span>
                    </div>
                    <button
                      onClick={handleTakeover}
                      className="text-xs text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-2 shrink-0"
                    >
                      Assumir agora
                    </button>
                  </div>
                )}

                {/* Área de Mensagens */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950">
                  {messages.map((msg) => {
                    const isCustomer = msg.sender === 'customer'
                    const isAi = msg.sender === 'ai'
                    const isAttendant = msg.sender === 'attendant'

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                      >
                        {/* Etiqueta de remetente */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 px-1">
                          {isCustomer && (
                            <>
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{currentConv.customer_name}</span>
                            </>
                          )}
                          {isAi && (
                            <>
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span className="text-purple-300 font-semibold">Assistente IA (Claude Haiku)</span>
                            </>
                          )}
                          {isAttendant && (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300 font-semibold">Atendente Humano</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatTime(msg.created_at)}</span>
                        </div>

                        {/* Balão de mensagem */}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-md ${
                            isCustomer
                              ? 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-sm'
                              : isAi
                              ? 'bg-gradient-to-br from-purple-950/80 to-indigo-950/80 text-purple-100 border border-purple-500/40 rounded-tr-sm'
                              : 'bg-gradient-to-br from-emerald-950/80 to-teal-950/80 text-emerald-100 border border-emerald-500/40 rounded-tr-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div
                            className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                              isCustomer
                                ? 'text-slate-400'
                                : isAi
                                ? 'text-purple-300/80'
                                : 'text-emerald-300/80'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {!isCustomer && <CheckCheck className="w-3 h-3 text-sky-400" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Respostas Rápidas */}
                <div className="px-6 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider shrink-0">
                    Respostas Rápidas:
                  </span>
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(reply)}
                      className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/70 transition"
                    >
                      {reply.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* Formulário de Envio do Atendente */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3 shrink-0"
                >
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={
                        currentConv.handled_by === 'human'
                          ? 'Digite a resposta do atendente para o cliente... (Enter para enviar)'
                          : 'A IA está no controle. Digite aqui para responder e assumir automaticamente...'
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isSending}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-semibold">Selecione uma conversa à esquerda</p>
                <p className="text-xs text-slate-600 mt-1">
                  Acompanhe os diálogos com a IA em tempo real ou responda diretamente aos clientes.
                </p>
              </div>
            )}
          </div>

          {/* ======================= COLUNA 3: SIMULADOR & CONTEXTO ======================= */}
          {showContextPanel && currentConv && (
            <div className="w-80 md:w-88 border-l border-slate-800 bg-slate-900/70 p-5 flex flex-col overflow-y-auto shrink-0">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Simulador & Ferramentas
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  Sandbox
                </span>
              </div>

              {/* Informações do Cliente */}
              <div className="space-y-3 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Perfil do Cliente
                </h4>
                <div>
                  <span className="text-[10px] text-slate-500 block">Nome</span>
                  <span className="text-xs font-semibold text-white">{currentConv.customer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Telefone</span>
                  <span className="text-xs font-semibold text-emerald-400">{currentConv.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Status de Atendimento</span>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentConv.needs_human
                        ? 'bg-red-500/20 text-red-300'
                        : currentConv.handled_by === 'ai'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {currentConv.needs_human
                      ? 'Requer Humano (Transbordo)'
                      : currentConv.handled_by === 'ai'
                      ? 'Conduzido por IA Haiku'
                      : 'Assumido por Humano'}
                  </span>
                </div>
              </div>

              {/* Simulador Interativo de Mensagens do Cliente */}
              <div className="bg-gradient-to-b from-purple-950/30 to-slate-950/80 p-4 rounded-xl border border-purple-500/20 space-y-4 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Simular Entrada do Cliente
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Envie mensagens como se fosse o cliente no WhatsApp para testar a resposta da IA e o gatilho de transbordo (RS-13 / RS-15).
                  </p>
                </div>

                {/* Botões de teste rápido */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    Cenários de Teste Rápidos:
                  </span>
                  <button
                    onClick={() => handleSimulateClient('Quero falar com um atendente por favor!')}
                    className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-red-300 border border-red-500/30 flex items-center justify-between group transition"
                  >
                    <span className="truncate">⚠️ "Quero falar com atendente"</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-300 transition" />
                  </button>
                  <button
                    onClick={() => handleSimulateClient('Quanto custa a Pizza Calabresa Grande?')}
                    className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-purple-300 border border-purple-500/30 flex items-center justify-between group transition"
                  >
                    <span className="truncate">🍕 "Quanto custa a Calabresa?"</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-300 transition" />
                  </button>
                  <button
                    onClick={() => handleSimulateClient('Minha pizza atrasou 40 minutos, quero cancelar!')}
                    className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-amber-300 border border-amber-500/30 flex items-center justify-between group transition"
                  >
                    <span className="truncate">🚨 "Pizza atrasou, quero cancelar"</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 transition" />
                  </button>
                </div>

                {/* Input livre para digitar como cliente */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <textarea
                    rows={2}
                    placeholder="Digite qualquer mensagem simulada do cliente..."
                    value={simulatedText}
                    onChange={(e) => setSimulatedText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
                  />
                  <button
                    onClick={() => handleSimulateClient()}
                    disabled={!simulatedText.trim()}
                    className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Mensagem do Cliente</span>
                  </button>
                </div>
              </div>

              {/* Informações da Edge Function e IA */}
              <div className="mt-auto p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>Configuração de IA</span>
                </div>
                <p>
                  • <strong>Modelo:</strong> Claude Haiku 4.5
                </p>
                <p>
                  • <strong>Webhook:</strong> <code>/whatsapp-webhook</code> (Evolution API)
                </p>
                <p>
                  • <strong>Transbordo:</strong> Reclamações e pedidos de humano acionam <code>needs_human = true</code> e alertam o painel instantaneamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

