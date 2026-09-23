import { describe, expect, it } from 'vitest'
import type { Cell, Grid } from '@shared/types'
import {
  cellIndex,
  colSpanOf,
  deleteCol,
  deleteRow,
  getCell,
  insertCol,
  makeEmptyCells,
  setColAisle,
} from './grid'

function grid(rows: number, cols: number): Grid {
  return { rows, cols, cells: makeEmptyCells(rows, cols) }
}

function set(g: Grid, row: number, col: number, patch: Partial<Cell>): void {
  const i = cellIndex(g.cols, row, col)
  g.cells[i] = { ...g.cells[i], ...patch }
}

describe('insertCol', () => {
  it('挿入位置より右のセルが右へシフトする', () => {
    const g = grid(2, 3)
    set(g, 0, 2, { content: { type: 'person', personId: 'x' } })
    const g2 = insertCol(g, 1)
    expect(g2.cols).toBe(4)
    expect(getCell(g2, 0, 3)?.content).toEqual({ type: 'person', personId: 'x' })
    expect(getCell(g2, 0, 1)?.content).toEqual({ type: 'empty' })
  })

  it('結合セルの内側への挿入は幅を広げる', () => {
    const g = grid(1, 3)
    set(g, 0, 0, { content: { type: 'person', personId: 'm' }, colSpan: 2 })
    set(g, 0, 1, { content: { type: 'empty' }, hidden: true })
    const g2 = insertCol(g, 1) // 結合(0,0)-(0,1) の内側
    expect(colSpanOf(getCell(g2, 0, 0)!)).toBe(3)
  })
})

describe('deleteCol / deleteRow', () => {
  it('削除で右のセルが左へシフトする', () => {
    const g = grid(2, 3)
    set(g, 0, 2, { content: { type: 'person', personId: 'x' } })
    const g2 = deleteCol(g, 0)
    expect(g2.cols).toBe(2)
    expect(getCell(g2, 0, 1)?.content).toEqual({ type: 'person', personId: 'x' })
  })

  it('最後の1列/1行は削除しない', () => {
    expect(deleteCol(grid(2, 1), 0).cols).toBe(1)
    expect(deleteRow(grid(1, 2), 0).rows).toBe(1)
  })
})

describe('setColAisle', () => {
  it('列全体を通路にする', () => {
    const g = grid(3, 3)
    const g2 = setColAisle(g, 1, true)
    for (let r = 0; r < 3; r++) {
      expect(getCell(g2, r, 1)?.content).toEqual({ type: 'aisle' })
    }
    expect(getCell(g2, 0, 0)?.content).toEqual({ type: 'empty' })
  })

  it('通路化する列にかかる結合は分解される', () => {
    const g = grid(1, 3)
    set(g, 0, 0, { content: { type: 'person', personId: 'm' }, colSpan: 2 })
    set(g, 0, 1, { content: { type: 'empty' }, hidden: true })
    const g2 = setColAisle(g, 1, true)
    expect(colSpanOf(getCell(g2, 0, 0)!)).toBe(1)
    expect(getCell(g2, 0, 0)?.content).toEqual({ type: 'person', personId: 'm' })
    expect(getCell(g2, 0, 1)?.content).toEqual({ type: 'aisle' })
  })
})
