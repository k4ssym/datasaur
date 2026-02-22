import { useQuery } from '@tanstack/react-query'
import { useHealthStore } from '../stores/healthStore'
import { checkHealth } from '../services/api'

export function useHealth() {
  const { setStatus, setLastCheck } = useHealthStore()

  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        const data = await checkHealth()
        setStatus(data.status === 'ok' ? 'online' : 'degraded')
        setLastCheck(Date.now())
        return data
      } catch {
        setStatus(import.meta.env.DEV ? 'online' : 'degraded')
        setLastCheck(Date.now())
        throw new Error('Health check failed')
      }
    },
    refetchInterval: 30_000,
    retry: 2,
    staleTime: 25_000,
  })
}
