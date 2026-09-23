import { FACILITY_LABELS } from '@shared/types'
import { rankColor, useSeatStore } from '@renderer/stores/useSeatStore'

/** 印刷 / PDF / PNG 共通の純粋グリッド（UIを含まない） */
export function PrintableSeatChart() {
  const project = useSeatStore((s) => s.project)
  const { grid } = project

  return (
    <div className="printable-root p-4" id="printable-seatchart">
      <h1 className="mb-3 text-lg font-bold text-gray-900">{project.meta.title}</h1>
      <div
        className="grid gap-px bg-gray-400"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, 96px)`,
          width: 'max-content',
        }}
      >
        {grid.cells.map((cell) => {
          const key = `${cell.row}:${cell.col}`
          if (cell.content.type === 'person') {
            const personId = cell.content.personId
            const p = project.people.find((x) => x.id === personId)
            const color = p ? rankColor(project, p.rankId) : null
            return (
              <div
                key={key}
                className="flex h-14 flex-col items-center justify-center border border-gray-300 text-center"
                style={{ backgroundColor: color ?? '#ffffff' }}
              >
                <span className="text-sm font-medium text-gray-900">{p?.name ?? ''}</span>
                {p?.note ? <span className="text-xs text-gray-700">{p.note}</span> : null}
              </div>
            )
          }
          if (cell.content.type === 'facility') {
            const facilityId = cell.content.facilityId
            const f = project.facilities.find((x) => x.id === facilityId)
            const label = f ? f.label || FACILITY_LABELS[f.kind] : ''
            return (
              <div
                key={key}
                className="flex h-14 items-center justify-center border border-gray-300 bg-gray-200 text-xs text-gray-600"
              >
                {label}
              </div>
            )
          }
          return (
            <div key={key} className="h-14 border border-gray-200 bg-white" />
          )
        })}
      </div>
    </div>
  )
}
