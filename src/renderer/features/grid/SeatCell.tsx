import { useDraggable, useDroppable } from '@dnd-kit/core'
import { FACILITY_LABELS, type Cell } from '@shared/types'
import { cellId } from '@renderer/lib/grid'
import { rankColor, useSeatStore } from '@renderer/stores/useSeatStore'
import { PersonChip } from './PersonChip'

export function SeatCell({ cell }: { cell: Cell }) {
  const { row, col } = cell
  const id = cellId(row, col)
  const selected = useSeatStore(
    (s) => s.selected?.row === row && s.selected?.col === col,
  )
  const selectCell = useSeatStore((s) => s.selectCell)

  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      onClick={() => selectCell({ row, col })}
      className={`seat-cell relative flex h-16 w-24 items-stretch justify-stretch border border-gray-300 ${
        isOver ? 'ring-2 ring-blue-400' : ''
      } ${selected ? 'outline outline-2 outline-blue-500' : ''}`}
    >
      <CellContentView cell={cell} />
    </div>
  )
}

function CellContentView({ cell }: { cell: Cell }) {
  const project = useSeatStore((s) => s.project)
  const { content, row, col } = cell

  if (content.type === 'person') {
    const person = project.people.find((p) => p.id === content.personId)
    if (!person) return <EmptyCell />
    return <DraggablePerson personId={person.id} row={row} col={col} />
  }

  if (content.type === 'facility') {
    const facility = project.facilities.find((f) => f.id === content.facilityId)
    const label = facility ? (facility.label || FACILITY_LABELS[facility.kind]) : '設備'
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-600">
        {label}
      </div>
    )
  }

  return <EmptyCell />
}

function EmptyCell() {
  return <div className="h-full w-full bg-white" />
}

function DraggablePerson({ personId, row, col }: { personId: string; row: number; col: number }) {
  const project = useSeatStore((s) => s.project)
  const person = project.people.find((p) => p.id === personId)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `drag:cell:${row}:${col}`,
    data: { source: 'cell', row, col },
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
