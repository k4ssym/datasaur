import { create } from 'zustand'
import type { DiagnosisResult } from '../types'

interface DiagnosisState {
  input: string
  isLoading: boolean
  progressStep: string | null
  result: DiagnosisResult | null
  error: string | null
  streamingText: string
  setInput: (input: string) => void
  setLoading: (loading: boolean) => void
  setProgressStep: (step: string | null) => void
  setResult: (result: DiagnosisResult | null) => void
  setError: (error: string | null) => void
  setStreamingText: (text: string) => void
  appendStreamingText: (text: string) => void
  clear: () => void
}

export const useDiagnosisStore = create<DiagnosisState>((set) => ({
  input: '',
  isLoading: false,
  progressStep: null,
  result: null,
  error: null,
  streamingText: '',
  setInput: (input) => set({ input }),
  setLoading: (isLoading) => set({ isLoading }),
  setProgressStep: (progressStep) => set({ progressStep }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setStreamingText: (streamingText) => set({ streamingText }),
  appendStreamingText: (text) =>
    set((s) => ({ streamingText: s.streamingText + text })),
  clear: () =>
    set({
      input: '',
      isLoading: false,
      progressStep: null,
      result: null,
      error: null,
      streamingText: '',
    }),
}))
