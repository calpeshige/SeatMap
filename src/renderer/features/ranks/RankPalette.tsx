import { useState } from 'react'
import { useSeatStore } from '@renderer/stores/useSeatStore'

const DEFAULT_NEW_COLOR = '#f6c343'

export function RankPalette() {
  const ranks = useSeatStore((s) => s.project.ranks)
  const addRank = useSeatStore((s) => s.addRank)
  const updateRank = useSeatStore((s) => s.updateRank)
  const removeRank = useSeatStore((s) => s.removeRank)
  const [name, setName] = useState('')

  const submit = () => {
    const n = name.trim()
    if (!n) return
    addRank(n, DEFAULT_NEW_COLOR)
    setName('')
  }

  return (
    <section className="border-b border-gray-200 p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">階級 / 色</h2>
      <ul className="space-y-1">
        {ranks.map((r) => (
          <li key={r.id} className="flex items-center gap-2">
            <input
              type="color"
              value={r.color}
              onChange={(e) => updateRank(r.id, { color: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-gray-300 p-0"
              title="色を変更"
            />
            <input
              value={r.name}
              onChange={(e) => updateRank(r.id, { name: e.target.value })}
              className="min-w-0 flex-1 rounded border border-gray-200 px-1 py-0.5 text-sm"
            />
            <button
              onClick={() => removeRank(r.id)}
              className="text-xs text-gray-400 hover:text-red-500"
              title="削除"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit()
          }}
          placeholder="階級名を追加"
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          onClick={submit}
          className="rounded bg-gray-800 px-2 py-1 text-sm text-white hover:bg-gray-700"
        >
          追加
        </button>
      </div>
    </section>
  )
}
