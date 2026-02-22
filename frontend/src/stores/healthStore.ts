import { create } from 'zustand'
import type { HealthStatus } from '../types'

interface HealthState extends HealthStatus {
  setStatus: (status: HealthStatus['status']) => void
  setLastCheck: (timestamp: number) => void
}

export const useHealthStore = create<HealthState>((set) => ({
  status: 'offline',
  lastCheck: 0,
  setStatus: (status) => set({ status }),
  setLastCheck: (lastCheck) => set({ lastCheck }),
}))
