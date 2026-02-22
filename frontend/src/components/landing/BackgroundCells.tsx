/**
 * Subtle grid/cell background for landing pages.
 * Light gray lines forming squares for a clean, technical aesthetic.
 */
const CELL_SIZE = 32
const STROKE_OPACITY = 0.15

export function BackgroundCells() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="cell-grid"
            width={CELL_SIZE}
            height={CELL_SIZE}
            patternUnits="userSpaceOnUse"
          >
            {/* vertical line (right edge of cell) */}
            <line
              x1={CELL_SIZE}
              y1={0}
              x2={CELL_SIZE}
              y2={CELL_SIZE}
              stroke="rgb(148 163 184)"
              strokeWidth="0.7"
              strokeOpacity={STROKE_OPACITY}
            />
            {/* horizontal line (bottom edge of cell) */}
            <line
              x1={0}
              y1={CELL_SIZE}
              x2={CELL_SIZE}
              y2={CELL_SIZE}
              stroke="rgb(148 163 184)"
              strokeWidth="0.7"
              strokeOpacity={STROKE_OPACITY}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cell-grid)" />
      </svg>
    </div>
  )
}
