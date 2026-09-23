import { FACILITY_LABELS, type Cell, type FacilityKind } from '@shared/types'
import { colSpanOf, colWidth, getCell, rowHeight, rowSpanOf } from '@renderer/lib/grid'
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
  const selectedCell = useSeatStore((s) => s.selectedCell)
  const selectedPersonId = useSeatStore((s) => s.selectedPersonId)
  const project = useSeatStore((s) => s.project)

  const person = selectedPersonId
    ? project.people.find((p) => p.id === selectedPersonId)
    : null
  const cell = selectedCell ? getCell(project.grid, selectedCell.row, selectedCell.col) : null

  if (!person && !cell) {
    return <div className="p-3 text-sm text-gray-400">セルまたは人を選択すると編集できます</div>
  }

  return (
    <div className="space-y-4 overflow-auto p-3">
      {person && <PersonEditor person={person} />}
      {cell?.content.type === 'empty' && !person && <PlaceButtons row={cell.row} col={cell.col} />}
      {cell?.content.type === 'aisle' && <AisleEditor row={cell.row} col={cell.col} />}
      {cell?.content.type === 'facility' && (
        <FacilityEditor facilityId={cell.content.facilityId} row={cell.row} col={cell.col} />
      )}
      {cell && <LayoutOps cell={cell} />}
    </div>
  )
}

function PersonEditor({ person }: { person: { id: string; name: string; rankId: string | null; note?: string } }) {
  const project = useSeatStore((s) => s.project)
  const updatePerson = useSeatStore((s) => s.updatePerson)
  const removePerson = useSeatStore((s) => s.removePerson)
  const clearCell = useSeatStore((s) => s.clearCell)
  const placed = project.grid.cells.find(
    (c) => c.content.type === 'person' && c.content.personId === person.id,
  )

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {placed ? `${placed.row + 1} 行 ${placed.col + 1} 列の人` : '未配置の人'}
      </h2>
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
        {placed && (
          <button
            onClick={() => clearCell(placed.row, placed.col)}
            className="flex-1 rounded border border-gray-300 py-1.5 text-sm hover:bg-gray-100"
          >
            席を空ける
          </button>
        )}
        <button
          onClick={() => removePerson(person.id)}
          className="flex-1 rounded border border-red-300 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          削除
        </button>
      </div>
    </section>
  )
}

function PlaceButtons({ row, col }: { row: number; col: number }) {
  const addPerson = useSeatStore((s) => s.addPerson)
  const addFacility = useSeatStore((s) => s.addFacility)
  const placeContent = useSeatStore((s) => s.placeContent)
  const selectCell = useSeatStore((s) => s.selectCell)

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        セル {row + 1} 行 {col + 1} 列
      </h2>
      <button
        onClick={() => {
          const id = addPerson('新しい人')
          placeContent(row, col, { type: 'person', personId: id })
          selectCell({ row, col })
        }}
        className="w-full rounded bg-gray-800 py-1.5 text-sm text-white hover:bg-gray-700"
      >
        人を置く
      </button>
      <button
        onClick={() => {
          const id = addFacility('other')
          placeContent(row, col, { type: 'facility', facilityId: id })
        }}
        className="w-full rounded border border-gray-300 py-1.5 text-sm hover:bg-gray-100"
      >
        設備を置く
      </button>
    </section>
  )
}

function AisleEditor({ row, col }: { row: number; col: number }) {
  const setAisle = useSeatStore((s) => s.setAisle)
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">通路マス</h2>
      <button
        onClick={() => setAisle(row, col, false)}
        className="w-full rounded border border-gray-300 py-1.5 text-sm hover:bg-gray-100"
      >
        空マスに戻す
      </button>
    </section>
  )
}

function FacilityEditor({
  facilityId,
  row,
  col,
}: {
  facilityId: string
  row: number
  col: number
}) {
  const project = useSeatStore((s) => s.project)
  const updateFacility = useSeatStore((s) => s.updateFacility)
  const clearCell = useSeatStore((s) => s.clearCell)
  const facility = project.facilities.find((f) => f.id === facilityId)
  if (!facility) return null

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">設備</h2>
      <label className="block text-sm">
        <span className="text-gray-500">種類</span>
        <select
          value={facility.kind}
          onChange={(e) => updateFacility(facility.id, { kind: e.target.value as FacilityKind })}
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
        onClick={() => clearCell(row, col)}
        className="w-full rounded border border-gray-300 py-1.5 text-sm hover:bg-gray-100"
      >
        セルを空ける
      </button>
    </section>
  )
}

function LayoutOps({ cell }: { cell: Cell }) {
  const grid = useSeatStore((s) => s.project.grid)
  const setAisle = useSeatStore((s) => s.setAisle)
  const setColAisle = useSeatStore((s) => s.setColAisle)
  const setRowAisle = useSeatStore((s) => s.setRowAisle)
  const mergeCell = useSeatStore((s) => s.mergeCell)
  const unmergeCell = useSeatStore((s) => s.unmergeCell)
  const insertRowAt = useSeatStore((s) => s.insertRowAt)
  const deleteRowAt = useSeatStore((s) => s.deleteRowAt)
  const insertColAt = useSeatStore((s) => s.insertColAt)
  const deleteColAt = useSeatStore((s) => s.deleteColAt)
  const setColWidth = useSeatStore((s) => s.setColWidth)
  const setRowHeight = useSeatStore((s) => s.setRowHeight)

  const { row, col } = cell
  const merged = colSpanOf(cell) > 1 || rowSpanOf(cell) > 1

  return (
    <section className="space-y-3 border-t border-gray-200 pt-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">レイアウト</h2>

      <div>
        <div className="mb-1 text-xs text-gray-500">通路</div>
        <div className="flex gap-1">
          {cell.content.type === 'aisle' ? (
            <OpBtn onClick={() => setAisle(row, col, false)}>このマスを戻す</OpBtn>
          ) : (
            <OpBtn onClick={() => setAisle(row, col, true)}>このマス</OpBtn>
          )}
          <OpBtn onClick={() => setColAisle(col, cell.content.type !== 'aisle')}>
            {cell.content.type === 'aisle' ? '列を戻す' : 'この列'}
          </OpBtn>
          <OpBtn onClick={() => setRowAisle(row, cell.content.type !== 'aisle')}>
            {cell.content.type === 'aisle' ? '行を戻す' : 'この行'}
          </OpBtn>
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs text-gray-500">結合</div>
        <div className="grid grid-cols-4 gap-1">
          <OpBtn onClick={() => mergeCell({ row, col }, 'left')}>左</OpBtn>
          <OpBtn onClick={() => mergeCell({ row, col }, 'right')}>右</OpBtn>
          <OpBtn onClick={() => mergeCell({ row, col }, 'up')}>上</OpBtn>
          <OpBtn onClick={() => mergeCell({ row, col }, 'down')}>下</OpBtn>
        </div>
        {merged && (
          <button
            onClick={() => unmergeCell({ row, col })}
            className="mt-1 w-full rounded border border-gray-300 py-1 text-xs hover:bg-gray-100"
          >
            結合を解除
          </button>
        )}
      </div>

      <div>
        <div className="mb-1 text-xs text-gray-500">行</div>
        <div className="flex gap-1">
          <OpBtn onClick={() => insertRowAt(row)}>上に追加</OpBtn>
          <OpBtn onClick={() => insertRowAt(row + 1)}>下に追加</OpBtn>
          <OpBtn onClick={() => deleteRowAt(row)}>削除</OpBtn>
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs text-gray-500">列</div>
        <div className="flex gap-1">
          <OpBtn onClick={() => insertColAt(col)}>左に追加</OpBtn>
          <OpBtn onClick={() => insertColAt(col + 1)}>右に追加</OpBtn>
          <OpBtn onClick={() => deleteColAt(col)}>削除</OpBtn>
        </div>
      </div>

      <div className="flex gap-3">
        <label className="flex-1 text-sm">
          <span className="text-xs text-gray-500">列幅(px)</span>
          <input
            type="number"
            min={24}
            value={colWidth(grid, col)}
            onChange={(e) => setColWidth(col, Number(e.target.value) || 24)}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="flex-1 text-sm">
          <span className="text-xs text-gray-500">行高(px)</span>
          <input
            type="number"
            min={20}
            value={rowHeight(grid, row)}
            onChange={(e) => setRowHeight(row, Number(e.target.value) || 20)}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </label>
      </div>
    </section>
  )
}

function OpBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded border border-gray-300 px-1 py-1 text-xs hover:bg-gray-100"
    >
      {children}
    </button>
  )
}
