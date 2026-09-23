import { FACILITY_LABELS, type FacilityKind } from '@shared/types'
import { getCell } from '@renderer/lib/grid'
import { useSeatStore } from '@renderer/stores/useSeatStore'

const FACILITY_KINDS: FacilityKind[] = [
  'emergency-exit',
  'whiteboard',
  'mfp',
  'shredder',
  'printer',
  'cabinet',
  'other',
]

export function CellInspector() {
  const selected = useSeatStore((s) => s.selected)
  const project = useSeatStore((s) => s.project)
  const addPerson = useSeatStore((s) => s.addPerson)
  const placeContent = useSeatStore((s) => s.placeContent)
  const clearCell = useSeatStore((s) => s.clearCell)
  const updatePerson = useSeatStore((s) => s.updatePerson)
  const removePerson = useSeatStore((s) => s.removePerson)
  const addFacility = useSeatStore((s) => s.addFacility)
  const updateFacility = useSeatStore((s) => s.updateFacility)

  if (!selected) {
    return (
      <div className="p-3 text-sm text-gray-400">セルを選択すると編集できます</div>
    )
  }

  const cell = getCell(project.grid, selected.row, selected.col)
  const content = cell?.content ?? { type: 'empty' as const }

  return (
    <div className="space-y-4 p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        セル {selected.row + 1} 行 {selected.col + 1} 列
      </h2>

      {content.type === 'empty' && (
        <div className="space-y-2">
          <button
            onClick={() => {
              const id = addPerson('新しい人')
              placeContent(selected.row, selected.col, { type: 'person', personId: id })
            }}
            className="w-full rounded bg-gray-800 py-1.5 text-sm text-white hover:bg-gray-700"
          >
            人を置く
          </button>
          <button
            onClick={() => {
              const id = addFacility('other')
              placeContent(selected.row, selected.col, { type: 'facility', facilityId: id })
            }}
            className="w-full rounded border border-gray-300 py-1.5 text-sm hover:bg-gray-100"
          >
            設備を置く
          </button>
        </div>
      )}

      {content.type === 'person' &&
        (() => {
          const person = project.people.find((p) => p.id === content.personId)
          if (!person) return null
          return (
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-gray-500">名前</span>
                <input
                  value={person.name}
                  onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-500">階級</span>
                <select
                  value={person.rankId ?? ''}
                  onChange={(e) => updatePerson(person.id, { rankId: e.target.value || null })}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                >
                  <option value="">（未割当）</option>
                  {project.ranks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-500">メモ（数字など）</span>
                <input
                  value={person.note ?? ''}
                  onChange={(e) => updatePerson(person.id, { note: e.target.value })}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => clearCell(selected.row, selected.col)}
                  className="flex-1 rounded border border-gray-300 py-1.5 text-sm hover:bg-gray-100"
                >
                  席を空ける
                </button>
                <button
                  onClick={() => removePerson(person.id)}
                  className="flex-1 rounded border border-red-300 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>
          )
        })()}

      {content.type === 'facility' &&
        (() => {
          const facility = project.facilities.find((f) => f.id === content.facilityId)
          if (!facility) return null
          return (
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-gray-500">設備の種類</span>
                <select
                  value={facility.kind}
                  onChange={(e) =>
                    updateFacility(facility.id, { kind: e.target.value as FacilityKind })
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                >
                  {FACILITY_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {FACILITY_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-500">表示名（任意で上書き）</span>
                <input
                  value={facility.label ?? ''}
                  onChange={(e) => updateFacility(facility.id, { label: e.target.value })}
                  placeholder={FACILITY_LABELS[facility.kind]}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <button
                onClick={() => clearCell(selected.row, selected.col)}
                className="w-full rounded border border-gray-300 py-1.5 text-sm hover:bg-gray-100"
              >
                セルを空ける
              </button>
            </div>
          )
        })()}
    </div>
  )
}
