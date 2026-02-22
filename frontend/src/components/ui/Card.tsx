interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 font-alumni ${className}`}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`font-aldrich text-lg font-bold text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}
