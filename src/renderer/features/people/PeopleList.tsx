import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Person } from '@shared/types'
import { rankColor, selectUnplacedPeople, useSeatStore } from '@renderer/stores/useSeatStore'
import { PersonChip } from '@renderer/features/grid/PersonChip'

export function PeopleList() {
  const unplaced = useSeatStore(selectUnplacedPeople)
  const addPerson = useSeatStore((s) => s.addPerson)
  const [name, setName] = useState('')

  const submit = () => {
    const n = name.trim()
    if (!n) return
    addPerson(n)
    setName('')
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        未配置の人（ドラッグで配置）
      </h2>
      <div className="mb-2 flex gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="名前を追加"
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          onClick={submit}
          className="rounded bg-gray-800 px-2 py-1 text-sm text-white hover:bg-gray-700"
        >
          追加
        </button>
      </div>
      <ul className="grid min-h-0 flex-1 grid-cols-2 content-start gap-1 overflow-auto">
        {unplaced.map((p) => (
          <UnplacedPerson key={p.id} person={p} />
        ))}
        {unplaced.length === 0 && (
          <li className="col-span-2 text-xs text-gray-400">全員配置済み</li>
        )}
      </ul>
    </section>
  )
}

function UnplacedPerson({ person }: { person: Person }) {
  const project = useSeatStore((s) => s.project)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `drag:list:${person.id}`,
    data: { source: 'list', personId: person.id },
  })
  const color = rankColor(project, person.rankId)

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`h-12 cursor-grab rounded border border-gray-200 ${isDragging ? 'opacity-30' : ''}`}
    >
      <PersonChip person={person} color={color} compact />
    </li>
  )
}
