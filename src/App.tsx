import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { TopToolbar } from '@renderer/features/toolbar/TopToolbar'
import { RankPalette } from '@renderer/features/ranks/RankPalette'
import { PeopleList } from '@renderer/features/people/PeopleList'
import { SeatGrid } from '@renderer/features/grid/SeatGrid'
import { CellInspector } from '@renderer/features/inspector/CellInspector'
import { PrintableSeatChart } from '@renderer/features/export/PrintableSeatChart'
import { PersonChip } from '@renderer/features/grid/PersonChip'
import { parseCellId, getCell } from '@renderer/lib/grid'
import { exportPdf, exportPng, openProject, printChart, saveProject } from '@renderer/lib/io'
import { rankColor, useSeatStore } from '@renderer/stores/useSeatStore'

type DragInfo =
  | { source: 'cell'; row: number; col: number }
  | { source: 'list'; personId: string }

export default function App() {
  const project = useSeatStore((s) => s.project)
  const swapCells = useSeatStore((s) => s.swapCells)
  const placeContent = useSeatStore((s) => s.placeContent)
  const newProject = useSeatStore((s) => s.newProject)
  const [activePersonId, setActivePersonId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  useEffect(() => {
    return window.seatmap.onMenu((action) => {
      switch (action) {
        case 'new':
          newProject()
          break
        case 'open':
          void openProject()
          break
        case 'save':
          void saveProject(false)
          break
        case 'save-as':
          void saveProject(true)
          break
        case 'print':
          void printChart()
          break
        case 'export-pdf':
          void exportPdf()
          break
        case 'export-png':
          void exportPng()
          break
      }
    })
  }, [newProject])

  const onDragStart = (e: DragStartEvent) => {
    const info = e.active.data.current as DragInfo | undefined
    if (!info) return
    if (info.source === 'list') {
      setActivePersonId(info.personId)
    } else {
      const cell = getCell(project.grid, info.row, info.col)
      if (cell?.content.type === 'person') setActivePersonId(cell.content.personId)
    }
  }

  const onDragEnd = (e: DragEndEvent) => {
    setActivePersonId(null)
    const info = e.active.data.current as DragInfo | undefined
    const overId = e.over?.id
    if (!info || typeof overId !== 'string') return
    const to = parseCellId(overId)
    if (!to) return

    const target = getCell(project.grid, to.row, to.col)
    if (!target || target.hidden || target.content.type === 'aisle') return

    if (info.source === 'cell') {
      swapCells({ row: info.row, col: info.col }, to)
    } else {
      // 未配置リストから配置。配置先に既に人が居れば、その人は参照が外れて未配置に戻る
      placeContent(to.row, to.col, { type: 'person', personId: info.personId })
    }
  }

  const activePerson = activePersonId
    ? project.people.find((p) => p.id === activePersonId)
    : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActivePersonId(null)}
    >
      <div className="no-print flex h-full flex-col">
        <TopToolbar />
        <div className="flex min-h-0 flex-1">
          {/* 左ペイン */}
          <aside className="no-print flex w-64 flex-col border-r border-gray-200 bg-white">
            <RankPalette />
            <PeopleList />
          </aside>

          {/* 中央: グリッドキャンバス */}
          <main className="no-print min-w-0 flex-1 overflow-auto bg-gray-50 p-4">
            <SeatGrid />
          </main>

          {/* 右ペイン */}
          <aside className="no-print w-64 border-l border-gray-200 bg-white">
            <CellInspector />
          </aside>
        </div>
      </div>

      <DragOverlay>
        {activePerson ? (
          <div className="h-16 w-24">
            <PersonChip person={activePerson} color={rankColor(project, activePerson.rankId)} />
          </div>
        ) : null}
      </DragOverlay>

      {/* 印刷 / PDF / PNG 用（画面外に常時描画） */}
      <PrintableSeatChart />
    </DndContext>
  )
}
