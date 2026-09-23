import { FACILITY_LABELS } from '@shared/types'
import { colSpanOf, colWidth, rowHeight, rowSpanOf } from '@renderer/lib/grid'
import { rankColor, useSeatStore } from '@renderer/stores/useSeatStore'

/** 印刷 / PDF / PNG 共通の純粋グリッド（UIを含まない） */
export function PrintableSeatChart() {
  const project = useSeatStore((s) => s.project)
  const { grid } = project

  const cols = Array.from({ length: grid.cols }, (_, c) => `${colWidth(grid, c)}px`).join(' ')
  const rows = Array.from({ length: grid.rows }, (_, r) => `${rowHeight(grid, r)}px`).join(' ')

  return (
    <div className="printable-root p-4" id="printable-seatchart">
      <h1 className="mb-3 text-lg font-bold text-gray-900">{project.meta.title}</h1>
      <div
        className="grid gap-0.5 bg-gray-100"
        style={{ gridTemplateColumns: cols, gridTemplateRows: rows, width: 'max-content' }}
      >
        {grid.cells
          .filter((cell) => !cell.hidden)
          .map((cell) => {
            const key = `${cell.row}:${cell.col}`
            const place = {
              gridColumn: `${cell.col + 1} / span ${colSpanOf(cell)}`,
              gridRow: `${cell.row + 1} / span ${rowSpanOf(cell)}`,
            }

            if (cell.content.type === 'person') {
              const p = project.people.find((x) => x.id === (cell.content as { personId: string }).personId)
              const color = p ? rankColor(project, p.rankId) : null
              return (
                <div
                  key={key}
                  style={{ ...place, backgroundColor: color ?? '#ffffff' }}
                  className="flex flex-col items-center justify-center border border-gray-300 text-center"
                >
                  <span className="text-sm font-medium text-gray-900">{p?.name ?? ''}</span>
                  {p?.note ? <span className="text-xs text-gray-700">{p.note}</span> : null}
                </div>
              )
            }
            if (cell.content.type === 'facility') {
              const f = project.facilities.find(
                (x) => x.id === (cell.content as { facilityId: string }).facilityId,
              )
              const label = f ? f.label || FACILITY_LABELS[f.kind] : ''
              return (
                <div
                  key={key}
                  style={place}
                  className="flex items-center justify-center border border-gray-300 bg-gray-200 text-xs text-gray-600"
                >
                  {label}
                </div>
              )
            }
            if (cell.content.type === 'aisle') {
              // 通路は編集画面と同じく背景と同化した「隙間」に
              return <div key={key} style={place} className="bg-gray-100" />
            }
            return <div key={key} style={place} className="border border-gray-300 bg-white" />
          })}
      </div>
    </div>
  )
}
