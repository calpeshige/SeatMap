import { useDraggable, useDroppable } from '@dnd-kit/core'
import { FACILITY_LABELS, type Cell, type CellContent } from '@shared/types'
import { cellId } from '@renderer/lib/grid'
import { rankColor, useSeatStore } from '@renderer/stores/useSeatStore'
import { PersonChip } from './PersonChip'

export function SeatCell({
  cell,
  paintActive,
  onPaintStart,
  onPaintEnter,
}: {
  cell: Cell
  paintActive: boolean
  onPaintStart: (row: number, col: number, type: CellContent['type']) => void
  onPaintEnter: (row: number, col: number, type: CellContent['type']) => void
}) {
  const { row, col } = cell
  const id = cellId(row, col)
  const selected = useSeatStore((s) => {
    if (s.selectedCell?.row === row && s.selectedCell?.col === col) return true
    return (
      !!s.selectedPersonId &&
      cell.content.type === 'person' &&
      cell.content.personId === s.selectedPersonId
    )
  })
  const selectCell = useSeatStore((s) => s.selectCell)

  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: paintActive || cell.content.type === 'aisle',
  })

  const isAisle = cell.content.type === 'aisle'

  return (
    <div
      ref={setNodeRef}
      onClick={() => {
        if (!paintActive) selectCell({ row, col })
      }}
      onMouseDown={() => {
        if (paintActive) onPaintStart(row, col, cell.content.type)
      }}
      onMouseEnter={() => {
        if (paintActive) onPaintEnter(row, col, cell.content.type)
      }}
      className={`seat-cell relative flex h-full w-full items-stretch justify-stretch ${
        paintActive ? 'cursor-crosshair select-none' : ''
      } ${isAisle ? 'border-0 bg-gray-100' : 'border border-gray-300'} ${
        isOver ? 'ring-2 ring-blue-400' : ''
      } ${selected ? 'outline outline-2 outline-blue-500' : ''}`}
    >
      <CellContentView cell={cell} paintActive={paintActive} />
    </div>
  )
}

function CellContentView({ cell, paintActive }: { cell: Cell; paintActive: boolean }) {
  const project = useSeatStore((s) => s.project)
  const { content, row, col } = cell

  if (content.type === 'person') {
    const person = project.people.find((p) => p.id === content.personId)
    if (!person) return <EmptyCell />
    return <DraggablePerson personId={person.id} row={row} col={col} paintActive={paintActive} />
  }

  if (content.type === 'facility') {
    const facility = project.facilities.find((f) => f.id === content.facilityId)
    const label = facility ? facility.label || FACILITY_LABELS[facility.kind] : '設備'
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-600">
        {label}
      </div>
    )
  }

  if (content.type === 'aisle') {
    return <div className="h-full w-full" />
  }

  return <EmptyCell />
}

function EmptyCell() {
  return <div className="h-full w-full bg-white" />
}

function DraggablePerson({
  personId,
  row,
  col,
  paintActive,
}: {
  personId: string
  row: number
  col: number
  paintActive: boolean
}) {
  const project = useSeatStore((s) => s.project)
  const person = project.people.find((p) => p.id === personId)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `drag:cell:${row}:${col}`,
    data: { source: 'cell', row, col },
    disabled: paintActive,
  })

  if (!person) return <EmptyCell />
  const color = rankColor(project, person.rankId)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`h-full w-full cursor-grab ${isDragging ? 'opacity-30' : ''}`}
    >
      <PersonChip person={person} color={color} />
    </div>
  )
}
