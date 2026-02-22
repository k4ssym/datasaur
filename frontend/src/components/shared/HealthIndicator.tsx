import { useHealthStore } from '../../stores/healthStore'

export function HealthIndicator() {
  const { status } = useHealthStore()

  return (
    <div
      className="flex items-center gap-2"
      title={status === 'online' ? 'LLM Online' : 'LLM Degraded'}
    >
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          status === 'online' ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-xs font-alumni text-gray-600">
        {status === 'online' ? 'LLM Online' : 'LLM Degraded'}
      </span>
    </div>
  )
}
