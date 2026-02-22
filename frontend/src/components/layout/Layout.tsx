import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { AiChatMini } from '../chat/AiChatMini'
import { useHealth } from '../../hooks/useHealth'

const SIDEBAR_WIDTH = 256

export function Layout() {
  useHealth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 font-alumni">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div
        className="flex flex-1 flex-col min-w-0 transition-[margin] duration-300 ease-out font-alumni"
        style={{ marginLeft: sidebarOpen ? SIDEBAR_WIDTH : 0 }}
      >
        <Header showAuth={false} showHealth showLogo={false} />
        <main className="flex-1 p-6 overflow-auto relative bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]">
          <Outlet />
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-all hover:bg-gray-800 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
            aria-label="Помощь / AI чат"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <AiChatMini open={chatOpen} onClose={() => setChatOpen(false)} />
        </main>
        <Footer />
      </div>
    </div>
  )
}
