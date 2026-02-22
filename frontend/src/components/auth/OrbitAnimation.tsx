export function OrbitAnimation() {
  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden">
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
        </div>
        <div className="absolute inset-0 rounded-full border border-gray-600 opacity-30 animate-[spin_15s_linear_infinite]" />
        <div className="absolute inset-0 rounded-full border border-gray-600 opacity-20 animate-[spin_22s_linear_infinite_reverse]" />
        <div className="absolute inset-0 rounded-full border border-gray-700 opacity-15 animate-[spin_28s_linear_infinite]" />
        <div className="absolute inset-0" style={{ animation: 'orbit 10s linear infinite' }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-gray-500"
              style={{
                left: `calc(50% + ${Math.cos((i / 8) * 2 * Math.PI) * 70}px)`,
                top: `calc(50% + ${Math.sin((i / 8) * 2 * Math.PI) * 70}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
