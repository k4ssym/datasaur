import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../stores/historyStore'
import { useAuthStore } from '../stores/authStore'
import { fetchHistory, deleteHistoryItem as apiDeleteHistoryItem, clearHistory as apiClearHistory } from '../services/api'
import type { DiagnosisResult } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function History() {
  const [search, setSearch] = useState('')
  const { user, accessToken } = useAuthStore()
  const { items: localItems, getFiltered, removeItem, clearAll } = useHistoryStore()
  const [serverItems, setServerItems] = useState<DiagnosisResult[]>([])
  const [loading, setLoading] = useState(!!user)
  const navigate = useNavigate()

  const isLoggedIn = !!user && !!accessToken
  const items = isLoggedIn ? serverItems : localItems
  const q = search.toLowerCase().trim()
  const filtered = isLoggedIn
    ? (q ? items.filter(
        (i) =>
          i.primaryDiagnosis.toLowerCase().includes(q) ||
          i.icd10Code.toLowerCase().includes(q) ||
          i.inputPreview.toLowerCase().includes(q)
      ) : items)
    : getFiltered(search)

  useEffect(() => {
    if (!isLoggedIn) {
      setServerItems([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchHistory()
      .then((res) => {
        if (!cancelled) setServerItems(res.items || [])
      })
      .catch(() => {
        if (!cancelled) setServerItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [isLoggedIn])

  const handleRemove = async (item: DiagnosisResult) => {
    if (isLoggedIn) {
      try {
        await apiDeleteHistoryItem(item.id)
        setServerItems((prev) => prev.filter((i) => i.id !== item.id))
      } catch {
        // keep UI as is
      }
    } else {
      removeItem(item.id)
    }
  }

  const handleClearAll = async () => {
    if (isLoggedIn) {
      try {
        await apiClearHistory()
        setServerItems([])
      } catch {
        // keep UI as is
      }
    } else {
      clearAll()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="font-aldrich text-3xl text-gray-900 mb-2">
          История анализов
        </h2>
        <p className="font-alumni text-gray-600">
          {isLoggedIn ? 'История сохраняется в вашем аккаунте' : 'Все ваши диагностики и результаты (локально)'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none font-alumni"
            />
          </div>
          <Button variant="primary" size="md">
            Фильтр
          </Button>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="md" onClick={handleClearAll} disabled={loading}>
            Очистить историю
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="font-aldrich text-2xl text-gray-900">{loading ? '…' : items.length}</p>
          <p className="font-alumni text-sm text-gray-500">Всего анализов</p>
        </Card>
        <Card className="text-center">
          <p className="font-aldrich text-2xl text-gray-900">0</p>
          <p className="font-alumni text-sm text-gray-500">Опросников</p>
        </Card>
        <Card className="text-center">
          <p className="font-aldrich text-2xl text-gray-900">0</p>
          <p className="font-alumni text-sm text-gray-500">Снимков</p>
        </Card>
        <Card className="text-center">
          <p className="font-aldrich text-2xl text-gray-900">0</p>
          <p className="font-alumni text-sm text-gray-500">IoT сессий</p>
        </Card>
      </div>

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-alumni text-gray-600">Загрузка истории…</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="w-24 h-24 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-aldrich text-xl text-gray-900 mb-2">
            История пуста
          </h3>
          <p className="font-alumni text-gray-600 max-w-md">
            Здесь будут отображаться все ваши анализы и диагностики
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-alumni text-sm text-gray-500">
                  {new Date(item.timestamp).toLocaleString('ru')}
                </p>
                <p className="font-alumni text-gray-900 truncate mt-1">
                  {item.inputPreview}...
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-alumni">
                    {item.primaryDiagnosis}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-alumni">
                    {item.icd10Code}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigate('/dashboard', { state: { prefill: item.inputText || item.inputPreview } })
                  }}
                >
                  Повторить
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item)}
                >
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
