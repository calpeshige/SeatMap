import { DEFAULT_CELL_H, DEFAULT_CELL_W, type Cell, type CellContent, type Grid } from '@shared/types'

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

export function colWidth(grid: Grid, col: number): number {
  return grid.colWidths?.[col] ?? DEFAULT_CELL_W
}

export function rowHeight(grid: Grid, row: number): number {
  return grid.rowHeights?.[row] ?? DEFAULT_CELL_H
}

export function colSpanOf(cell: Cell): number {
  return cell.colSpan ?? 1
}

export function rowSpanOf(cell: Cell): number {
  return cell.rowSpan ?? 1
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

/** 結合のマスター（覆われていないセル）だけを抽出 */
interface Master {
  row: number
  col: number
  rowSpan: number
  colSpan: number
  content: CellContent
}

function extractMasters(grid: Grid): Master[] {
  return grid.cells
    .filter((c) => !c.hidden)
    .map((c) => ({
      row: c.row,
      col: c.col,
      rowSpan: rowSpanOf(c),
      colSpan: colSpanOf(c),
      content: c.content,
    }))
}

/** マスター一覧から rows*cols のグリッドを再構築（覆われるセルは hidden 空マスに） */
function buildGrid(
  rows: number,
  cols: number,
  masters: Master[],
  colWidths?: number[],
  rowHeights?: number[],
): Grid {
  const cells = makeEmptyCells(rows, cols)
  for (const m of masters) {
    if (m.row >= rows || m.col >= cols) continue // 範囲外は破棄
    const rs = Math.max(1, Math.min(m.rowSpan, rows - m.row))
    const cs = Math.max(1, Math.min(m.colSpan, cols - m.col))
    cells[cellIndex(cols, m.row, m.col)] = {
      row: m.row,
      col: m.col,
      content: m.content,
      rowSpan: rs,
      colSpan: cs,
    }
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        if (dr === 0 && dc === 0) continue
        cells[cellIndex(cols, m.row + dr, m.col + dc)] = {
          row: m.row + dr,
          col: m.col + dc,
          content: { type: 'empty' },
          hidden: true,
        }
      }
    }
  }
  return { rows, cols, cells, colWidths, rowHeights }
}

function insertAt(arr: number[] | undefined, at: number, value: number): number[] | undefined {
  if (!arr) return undefined
  const next = arr.slice()
  next.splice(at, 0, value)
  return next
}

function removeAt(arr: number[] | undefined, at: number): number[] | undefined {
  if (!arr) return undefined
  const next = arr.slice()
  next.splice(at, 1)
  return next
}

/** 末尾での行×列サイズ変更（既存内容・結合・幅は保持） */
export function resizeGrid(grid: Grid, rows: number, cols: number): Grid {
  return buildGrid(rows, cols, extractMasters(grid), grid.colWidths, grid.rowHeights)
}

export function insertCol(grid: Grid, at: number): Grid {
  const masters = extractMasters(grid).map((m) => {
    if (m.col >= at) return { ...m, col: m.col + 1 }
    if (m.col + m.colSpan > at) return { ...m, colSpan: m.colSpan + 1 } // 結合内への挿入は幅を広げる
    return m
  })
  return buildGrid(grid.rows, grid.cols + 1, masters, insertAt(grid.colWidths, at, DEFAULT_CELL_W), grid.rowHeights)
}

export function insertRow(grid: Grid, at: number): Grid {
  const masters = extractMasters(grid).map((m) => {
    if (m.row >= at) return { ...m, row: m.row + 1 }
    if (m.row + m.rowSpan > at) return { ...m, rowSpan: m.rowSpan + 1 }
    return m
  })
  return buildGrid(grid.rows + 1, grid.cols, masters, grid.colWidths, insertAt(grid.rowHeights, at, DEFAULT_CELL_H))
}

export function deleteCol(grid: Grid, at: number): Grid {
  if (grid.cols <= 1) return grid
  const masters: Master[] = []
  for (const m of extractMasters(grid)) {
    let { col, colSpan } = m
    if (col > at) {
      col -= 1
    } else if (col === at) {
      colSpan -= 1
      if (colSpan < 1) continue // 単独列のマスターは消える
    } else if (col + colSpan - 1 >= at) {
      colSpan -= 1
    }
    masters.push({ ...m, col, colSpan })
  }
  return buildGrid(grid.rows, grid.cols - 1, masters, removeAt(grid.colWidths, at), grid.rowHeights)
}

function splitMasters(masters: Master[], predicate: (m: Master) => boolean): Master[] {
  const out: Master[] = []
  for (const m of masters) {
    if (predicate(m) && (m.colSpan > 1 || m.rowSpan > 1)) {
      for (let dr = 0; dr < m.rowSpan; dr++) {
        for (let dc = 0; dc < m.colSpan; dc++) {
          out.push({
            row: m.row + dr,
            col: m.col + dc,
            rowSpan: 1,
            colSpan: 1,
            content: dr === 0 && dc === 0 ? m.content : { type: 'empty' },
          })
        }
      }
    } else {
      out.push(m)
    }
  }
  return out
}

/** 列まるごとを通路(on) / 空マス(off) にする。かかる結合は先に分解する */
export function setColAisle(grid: Grid, col: number, on: boolean): Grid {
  const masters = splitMasters(extractMasters(grid), (m) => m.col <= col && col < m.col + m.colSpan)
  const g = buildGrid(grid.rows, grid.cols, masters, grid.colWidths, grid.rowHeights)
  const cells = g.cells.slice()
  for (let r = 0; r < g.rows; r++) {
    cells[cellIndex(g.cols, r, col)] = { row: r, col, content: { type: on ? 'aisle' : 'empty' } }
  }
  return { ...g, cells }
}

/** 行まるごとを通路(on) / 空マス(off) にする */
export function setRowAisle(grid: Grid, row: number, on: boolean): Grid {
  const masters = splitMasters(extractMasters(grid), (m) => m.row <= row && row < m.row + m.rowSpan)
  const g = buildGrid(grid.rows, grid.cols, masters, grid.colWidths, grid.rowHeights)
  const cells = g.cells.slice()
  for (let c = 0; c < g.cols; c++) {
    cells[cellIndex(g.cols, row, c)] = { row, col: c, content: { type: on ? 'aisle' : 'empty' } }
  }
  return { ...g, cells }
}

export function deleteRow(grid: Grid, at: number): Grid {
  if (grid.rows <= 1) return grid
  const masters: Master[] = []
  for (const m of extractMasters(grid)) {
    let { row, rowSpan } = m
    if (row > at) {
      row -= 1
    } else if (row === at) {
      rowSpan -= 1
      if (rowSpan < 1) continue
    } else if (row + rowSpan - 1 >= at) {
      rowSpan -= 1
    }
    masters.push({ ...m, row, rowSpan })
  }
  return buildGrid(grid.rows - 1, grid.cols, masters, grid.colWidths, removeAt(grid.rowHeights, at))
}
