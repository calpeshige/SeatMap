import { useSeatStore } from '@renderer/stores/useSeatStore'
import { SeatCell } from './SeatCell'

export function SeatGrid() {
  const grid = useSeatStore((s) => s.project.grid)

  return (
    <div className="inline-block">
      <div
        className="grid gap-0.5 bg-gray-100 p-2"
        style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, max-content))` }}
      >
        {grid.cells.map((cell) => (
          <SeatCell key={`${cell.row}:${cell.col}`} cell={cell} />
        ))}
      </div>
    </div>
  )
}
