import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-7 h-7' }

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="qaz.med"
        className={sizes[size]}
      />
      {showText && <span className="font-aldrich text-xl text-gray-900">qaz.med</span>}
    </Link>
  )
}
