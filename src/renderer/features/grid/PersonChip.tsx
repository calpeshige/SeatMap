import type { Person } from '@shared/types'

/** 人マスの見た目（セル内・ドラッグオーバーレイ・リストで共有） */
export function PersonChip({
  person,
  color,
  compact = false,
}: {
  person: Person
  color: string | null
  compact?: boolean
}) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center ${
        compact ? 'px-2 py-1' : 'px-1'
      }`}
      style={{ backgroundColor: color ?? '#ffffff' }}
    >
      <span className="truncate text-sm font-medium text-gray-900">{person.name || '（無名）'}</span>
      {person.note ? (
        <span className="text-xs leading-none text-gray-700">{person.note}</span>
      ) : null}
    </div>
  )
}
