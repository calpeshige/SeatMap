import { useCallback, useEffect, useRef } from 'react'
import type { CellContent } from '@shared/types'
import { colSpanOf, colWidth, rowHeight, rowSpanOf } from '@renderer/lib/grid'
import { useSeatStore } from '@renderer/stores/useSeatStore'
import { SeatCell } from './SeatCell'

export function SeatGrid() {
  const grid = useSeatStore((s) => s.project.grid)
  const zoom = useSeatStore((s) => s.zoom)
  const paintTool = useSeatStore((s) => s.paintTool)
  const setAisle = useSeatStore((s) => s.setAisle)
  const addFacility = useSeatStore((s) => s.addFacility)
  const placeContent = useSeatStore((s) => s.placeContent)
  const clearCell = useSeatStore((s) => s.clearCell)
  const paintActive = paintTool !== null

  // なぞり塗り: 最初に触れたマスの状態で描く/消すを決め、ドラッグ中は統一
  const paintMode = useRef<'draw' | 'erase' | null>(null)
  useEffect(() => {
    const up = () => {
      paintMode.current = null
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  const apply = useCallback(
    (row: number, col: number, type: CellContent['type']) => {
      const mode = paintMode.current
      if (!mode || !paintTool) return
      if (paintTool === 'aisle') {
        if (mode === 'draw' && type === 'empty') setAisle(row, col, true)
        if (mode === 'erase' && type === 'aisle') setAisle(row, col, false)
      } else {
        // 設備スタンプ: 空マスに配置 / 既存の設備マスは消す（空マスに戻す）
        if (mode === 'draw' && type === 'empty') {
          const id = addFacility(paintTool)
          placeContent(row, col, { type: 'facility', facilityId: id })
        }
        if (mode === 'erase' && type === 'facility') clearCell(row, col)
      }
    },
    [paintTool, setAisle, addFacility, placeContent, clearCell],
  )

  const onPaintStart = useCallback(
    (row: number, col: number, type: CellContent['type']) => {
      const eraseHit = paintTool === 'aisle' ? type === 'aisle' : type === 'facility'
      paintMode.current = eraseHit ? 'erase' : 'draw'
      apply(row, col, type)
    },
    [apply, paintTool],
  )

  const cols = Array.from({ length: grid.cols }, (_, c) => `${colWidth(grid, c)}px`).join(' ')
  const rows = Array.from({ length: grid.rows }, (_, r) => `${rowHeight(grid, r)}px`).join(' ')

  return (
    <div className="inline-block origin-top-left" style={{ transform: `scale(${zoom})` }}>
      <div
        className="grid gap-0.5 bg-gray-100 p-2"
        style={{ gridTemplateColumns: cols, gridTemplateRows: rows }}
      >
        {grid.cells
          .filter((cell) => !cell.hidden)
          .map((cell) => (
            <div
              key={`${cell.row}:${cell.col}`}
              style={{
                gridColumn: `${cell.col + 1} / span ${colSpanOf(cell)}`,
                gridRow: `${cell.row + 1} / span ${rowSpanOf(cell)}`,
              }}
            >
              <SeatCell
                cell={cell}
                paintActive={paintActive}
                onPaintStart={onPaintStart}
                onPaintEnter={apply}
              />
            </div>
          ))}
      </div>
    </div>
  )
}
