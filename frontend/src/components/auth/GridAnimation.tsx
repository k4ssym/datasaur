import { useState, useEffect } from 'react'

const GRID_SIZE = 6
const TOTAL = GRID_SIZE * GRID_SIZE

export function GridAnimation({ progress = 0 }: { progress?: number }) {
  const [highlighted, setHighlighted] = useState<number[]>([])

  useEffect(() => {
    const count = Math.ceil(progress * TOTAL) + 4
    const indices = Array.from({ length: Math.min(count, TOTAL) }, (_, i) => i)
    setHighlighted(indices)
  }, [progress])

  return (
    <div className="grid grid-cols-6 gap-2 p-4 w-full max-w-md mx-auto">
      {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
        <div
          key={i}
          className={`aspect-square rounded-lg transition-all duration-500 ${
            highlighted.includes(i)
              ? 'bg-gray-600 opacity-80'
              : 'bg-gray-800/30 border border-gray-700/50'
          }`}
          style={{
            animation: highlighted.includes(i) ? 'grid-pulse 2s ease-in-out infinite' : undefined,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}
