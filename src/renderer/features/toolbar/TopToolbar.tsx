import { FACILITY_LABELS, type FacilityKind } from '@shared/types'
import { useSeatStore, type PaintTool } from '@renderer/stores/useSeatStore'
import { exportPdf, exportPng, openProject, printChart, saveProject } from '@renderer/lib/io'

const FACILITY_KINDS: FacilityKind[] = [
  'printer',
  'mfp',
  'shredder',
  'cabinet',
  'whiteboard',
  'emergency-exit',
  'other',
]

export function TopToolbar() {
  const grid = useSeatStore((s) => s.project.grid)
  const title = useSeatStore((s) => s.project.meta.title)
  const dirty = useSeatStore((s) => s.dirty)
  const setGridSize = useSeatStore((s) => s.setGridSize)
  const newProject = useSeatStore((s) => s.newProject)
  const updateTitle = (t: string) =>
    useSeatStore.setState((s) => ({
      project: { ...s.project, meta: { ...s.project.meta, title: t } },
      dirty: true,
    }))

  return (
    <div className="no-print flex items-center gap-4 border-b border-gray-200 bg-white px-3 py-2">
      <input
        value={title}
        onChange={(e) => updateTitle(e.target.value)}
        className="w-48 rounded border border-transparent px-1 py-0.5 text-sm font-semibold hover:border-gray-300 focus:border-gray-300"
      />
      {dirty && <span className="text-xs text-amber-600">● 未保存</span>}

      <div className="flex gap-1">
        <ToolButton onClick={newProject}>新規</ToolButton>
        <ToolButton onClick={() => void openProject()}>開く</ToolButton>
        <ToolButton onClick={() => void saveProject(false)}>保存</ToolButton>
      </div>

      <DefaultButtons />

      <div className="flex gap-1">
        <ToolButton onClick={() => void printChart()}>印刷</ToolButton>
        <ToolButton onClick={() => void exportPdf()}>PDF</ToolButton>
        <ToolButton onClick={() => void exportPng()}>PNG</ToolButton>
      </div>

      <PaintToolSelect />

      <div className="flex items-center gap-1 text-sm text-gray-600">
        <span>グリッド</span>
        <NumberInput value={grid.rows} min={1} max={40} onChange={(v) => setGridSize(v, grid.cols)} />
        <span>×</span>
        <NumberInput value={grid.cols} min={1} max={40} onChange={(v) => setGridSize(grid.rows, v)} />
      </div>

      <ZoomControl />
    </div>
  )
}

function ZoomControl() {
  const zoom = useSeatStore((s) => s.zoom)
  const setZoom = useSeatStore((s) => s.setZoom)
  return (
    <div className="flex items-center gap-1 text-sm text-gray-600">
      <span>表示</span>
      <button
        onClick={() => setZoom(zoom - 0.1)}
        className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100"
      >
        −
      </button>
      <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
      <button
        onClick={() => setZoom(zoom + 0.1)}
        className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100"
      >
        ＋
      </button>
    </div>
  )
}

function DefaultButtons() {
  const saveAsDefault = useSeatStore((s) => s.saveAsDefault)
  const applyDefault = useSeatStore((s) => s.applyDefault)
  return (
    <div className="flex gap-1">
      <ToolButton
        onClick={() => {
          saveAsDefault()
          alert('現在のレイアウト（通路・設備・グリッド・階級）をデフォルトに保存しました（人は含みません）')
        }}
      >
        デフォルト保存
      </ToolButton>
      <ToolButton
        onClick={() => {
          if (!applyDefault()) {
            alert('デフォルトが未保存です。先に「デフォルト保存」してください')
          }
        }}
      >
        デフォルト適用
      </ToolButton>
    </div>
  )
}

function PaintToolSelect() {
  const paintTool = useSeatStore((s) => s.paintTool)
  const setPaintTool = useSeatStore((s) => s.setPaintTool)
  const active = paintTool !== null
  return (
    <div
      className={`flex items-center gap-1 rounded border px-2 py-1 text-sm ${
        active ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      title="選ぶと配置モードになり、マスをクリック/ドラッグでなぞって配置。同じ所をなぞると消せます"
    >
      <span className="text-gray-600">配置</span>
      <select
        value={paintTool ?? ''}
        onChange={(e) => setPaintTool((e.target.value || null) as PaintTool)}
        className="rounded border border-gray-300 bg-white px-1 py-0.5"
      >
        <option value="">なし</option>
        <option value="aisle">通路</option>
        {FACILITY_KINDS.map((k) => (
          <option key={k} value={k}>
            {FACILITY_LABELS[k]}
          </option>
        ))}
      </select>
    </div>
  )
}

function ToolButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
    >
      {children}
    </button>
  )
}

function NumberInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const v = Math.max(min, Math.min(max, Number(e.target.value) || min))
        onChange(v)
      }}
      className="w-14 rounded border border-gray-300 px-1 py-0.5 text-center"
    />
  )
}
