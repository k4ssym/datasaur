import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  text: string
  className?: string
  speed?: number
  delay?: number
}

export function TypewriterText({ text, className = '', speed = 80, delay = 500 }: TypewriterTextProps) {
  const [display, setDisplay] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    if (display.length >= text.length) return

    const timer = setTimeout(() => {
      setDisplay(text.slice(0, display.length + 1))
    }, speed)

    return () => clearTimeout(timer)
  }, [started, display, text, speed])

  return (
    <span className={className}>
      {display}
      {display.length < text.length && <span className="animate-pulse">|</span>}
    </span>
  )
}
