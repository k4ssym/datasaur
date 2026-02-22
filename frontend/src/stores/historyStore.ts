import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DiagnosisResult } from '../types'

interface HistoryState {
  items: DiagnosisResult[]
  addItem: (item: DiagnosisResult) => void
  removeItem: (id: string) => void
  clearAll: () => void
  getFiltered: (query: string) => DiagnosisResult[]
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((s) => ({
          items: [item, ...s.items.filter((i) => i.id !== item.id)].slice(0, 100),
        })),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clearAll: () => set({ items: [] }),
      getFiltered: (query) => {
        const q = query.toLowerCase().trim()
        if (!q) return get().items
        return get().items.filter(
          (i) =>
            i.primaryDiagnosis.toLowerCase().includes(q) ||
            i.icd10Code.toLowerCase().includes(q) ||
            i.inputPreview.toLowerCase().includes(q)
        )
      },
    }),
    { name: 'diagnosis-history' }
  )
)
