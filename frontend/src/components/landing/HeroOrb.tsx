export function HeroOrb() {
  return (
    <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
      <div className="relative w-72 h-72">
        <div className="absolute inset-0 rounded-full border border-gray-200/80 animate-[orb-pulse_4s_ease-in-out_infinite]" />
        <div className="absolute inset-6 rounded-full border border-gray-200/60 animate-[orb-pulse_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute inset-12 rounded-full border border-gray-200/50 animate-[orb-pulse_6s_ease-in-out_infinite_1s]" />
        <div className="absolute inset-20 rounded-full border border-gray-200/40 animate-[orb-pulse_7s_ease-in-out_infinite_1.5s]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        </div>
        {[...Array(16)].map((_, i) => {
          const angle = (i / 16) * 2 * Math.PI
          const r = 120
          const x = 50 + (r * Math.cos(angle) / 144) * 100
          const y = 50 + (r * Math.sin(angle) / 144) * 100
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-gray-300 animate-[orb-float_3s_ease-in-out_infinite]"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          )
        })}
      </div>
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
