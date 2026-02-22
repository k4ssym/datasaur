import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  time: Date
}

interface AiChatMiniProps {
  open: boolean
  onClose: () => void
}

export function AiChatMini({ open, onClose }: AiChatMiniProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'Здравствуйте! Я помощник Qaz.med. Задайте вопрос по диагностике, анализам или навигации по платформе.',
      time: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [open, messages])

  const send = () => {
    const t = input.trim()
    if (!t) return
    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      text: t,
      time: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    // Placeholder reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          text: 'Ваш запрос принят. В этой версии ответы генерируются в демо-режиме. Скоро здесь будет подключён полноценный AI.',
          time: new Date(),
        },
      ])
    }, 600)
  }

  if (!open) return null

  return (
    <div
      className="fixed bottom-24 right-8 z-50 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl bg-white font-alumni shadow-2xl ring-1 ring-black/5"
      style={{
        height: '420px',
        animation: 'chatSlideUp 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-alumni text-sm font-semibold text-gray-900">AI Помощник</h3>
            <p className="font-alumni text-xs text-gray-500">Онлайн</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Закрыть"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-alumni text-sm ${
                m.role === 'user'
                  ? 'bg-black text-white rounded-br-md'
                  : 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-100 rounded-bl-md'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Напишите сообщение..."
            className="font-alumni flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <button
            type="button"
            onClick={send}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-black text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Отправить"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
