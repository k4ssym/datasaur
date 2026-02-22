import { useEffect, useRef } from 'react'

interface OrbitalParticle {
  ringIndex: number
  angle: number
  speed: number
  radius: number
  size: number
  phaseOffset: number
  floatAmplitude: number
  trailLength: number
}

const RING_COUNT = 6
const PARTICLES_PER_RING = [2, 4, 6, 4, 2, 0]
const RING_RADII = [0.12, 0.24, 0.36, 0.48, 0.6, 0.72]

export function NeuroOrbitAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let particles: OrbitalParticle[] = []
    let time = 0
    const particleHistory: Map<number, { x: number; y: number }[]> = new Map()

    const getSize = () => {
      const rect = container.getBoundingClientRect()
      return { w: rect.width, h: rect.height }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { w, h } = getSize()
      if (w <= 0 || h <= 0) return
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      initParticles()
    }

    const initParticles = () => {
      particles = []
      particleHistory.clear()
      const { w, h } = getSize()
      const centerX = w / 2
      const centerY = h / 2
      const minDim = Math.min(centerX, centerY)

      for (let r = 0; r < RING_COUNT; r++) {
        const count = PARTICLES_PER_RING[r]
        const radius = RING_RADII[r] * minDim
        const speed = (r % 2 === 0 ? 1 : -1) * (0.15 + r * 0.04)
        const floatAmp = 1.5 + r * 0.4

        for (let i = 0; i < count; i++) {
          const idx = particles.length
          particles.push({
            ringIndex: r,
            angle: (i / count) * Math.PI * 2 + (i % 2) * 0.3,
            speed,
            radius,
            size: Math.max(1.5, 2.5 - r * 0.15),
            phaseOffset: (i / count) * Math.PI * 2,
            floatAmplitude: floatAmp,
            trailLength: 8 + r * 2,
          })
          particleHistory.set(idx, [])
        }
      }
    }

    const draw = () => {
      const { w, h } = getSize()
      if (w <= 0 || h <= 0) {
        animationId = requestAnimationFrame(draw)
        return
      }
      const centerX = w / 2
      const centerY = h / 2
      const minDim = Math.min(centerX, centerY)

      ctx.clearRect(0, 0, w, h)

      // Concentric rings with staggered rotation and opacity pulse
      for (let r = 0; r < RING_COUNT; r++) {
        const radius = RING_RADII[r] * minDim
        const pulse = 0.8 + 0.2 * Math.sin(time * 0.4 + r * 1.2)
        const ringOpacity = 0.12 + 0.08 * Math.sin(time * 0.3 + r * 0.5)
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(156, 163, 175, ${ringOpacity * pulse})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      // Central core with animated glow
      const corePulse = 0.9 + 0.1 * Math.sin(time * 2)
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 28 * corePulse
      )
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      coreGradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)')
      coreGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)')
      coreGradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.08)')
      coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, 28, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 1)'
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Orbiting particles with trails
      particles.forEach((p, idx) => {
        const currentAngle = p.angle + time * p.speed + p.phaseOffset * 0.08
        const floatY = Math.sin(time * 1.5 + p.phaseOffset) * p.floatAmplitude
        const floatX = Math.cos(time * 0.8 + p.phaseOffset * 1.3) * p.floatAmplitude * 0.5
        const x = centerX + Math.cos(currentAngle) * p.radius + floatX
        const y = centerY + Math.sin(currentAngle) * p.radius + floatY

        const history = particleHistory.get(idx) || []
        history.push({ x, y })
        if (history.length > p.trailLength) history.shift()
        particleHistory.set(idx, history)

        // Trail
        if (history.length > 1) {
          ctx.beginPath()
          ctx.moveTo(history[0].x, history[0].y)
          history.forEach((pt) => {
            ctx.lineTo(pt.x, pt.y)
          })
          ctx.strokeStyle = `rgba(156, 163, 175, ${0.15 * (1 - 1 / history.length)})`
          ctx.lineWidth = 1
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.stroke()
        }

        const alpha = 0.6 + 0.4 * Math.sin(time * 1.5 + p.phaseOffset) * 0.5
        ctx.fillStyle = `rgba(180, 190, 200, ${Math.min(1, alpha)})`
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      time += 0.016
      animationId = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      />
    </div>
  )
}
