import type { Cell, Grid } from '@shared/types'

export function cellId(row: number, col: number): string {
  return `cell:${row}:${col}`
}

export function parseCellId(id: string): { row: number; col: number } | null {
  const m = /^cell:(\d+):(\d+)$/.exec(id)
  if (!m) return null
  return { row: Number(m[1]), col: Number(m[2]) }
}

export function cellIndex(cols: number, row: number, col: number): number {
  return row * cols + col
}

export function getCell(grid: Grid, row: number, col: number): Cell | undefined {
  return grid.cells[cellIndex(grid.cols, row, col)]
}

/** rows*cols 個の空セルを row-major で作る */
export function makeEmptyCells(rows: number, cols: number): Cell[] {
  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c, content: { type: 'empty' } })
    }
  }
  return cells
}

/**
 * グリッドサイズ変更。既存セルの中身を新サイズに移す。
 * はみ出したセルの中身（人/設備）は捨てず overflow として返す。
 */
export function resizeGrid(
  grid: Grid,
  rows: number,
  cols: number,
): { grid: Grid; overflow: Cell['content'][] } {
  const cells = makeEmptyCells(rows, cols)
  const overflow: Cell['content'][] = []
  for (const cell of grid.cells) {
    if (cell.content.type === 'empty') continue
    if (cell.row < rows && cell.col < cols) {
      cells[cellIndex(cols, cell.row, cell.col)].content = cell.content
    } else {
      overflow.push(cell.content)
    }
  }
  return { grid: { rows, cols, cells }, overflow }
}
