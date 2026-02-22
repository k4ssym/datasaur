import { useState } from 'react'

const GRID_ITEMS = 9

export function AnimatedGrid() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(GRID_ITEMS)].map((_, i) => (
        <div
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          className={`
            aspect-square rounded-xl transition-all duration-500
            ${hovered === i 
              ? 'bg-gray-200 shadow-xl shadow-gray-300/50 scale-105' 
              : 'bg-gray-100 shadow-md shadow-gray-200/60'
            }
            ${hovered !== null && hovered !== i ? 'opacity-70 scale-95' : ''}
          `}
          style={{
            animation: hovered === null ? `grid-float ${3 + i * 0.3}s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}
