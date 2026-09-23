import { describe, expect, it, beforeEach } from 'vitest'
import { useSeatStore } from './useSeatStore'
import { getCell } from '@renderer/lib/grid'

function reset() {
  useSeatStore.getState().newProject()
  useSeatStore.getState().setGridSize(3, 3)
}

describe('swapCells', () => {
  beforeEach(reset)

  it('人 <-> 空 で移動する', () => {
    const s = useSeatStore.getState()
    const pid = s.addPerson('太郎')
    s.placeContent(0, 0, { type: 'person', personId: pid })

    s.swapCells({ row: 0, col: 0 }, { row: 2, col: 2 })

    const p = useSeatStore.getState().project
    expect(getCell(p.grid, 0, 0)?.content).toEqual({ type: 'empty' })
    expect(getCell(p.grid, 2, 2)?.content).toEqual({ type: 'person', personId: pid })
  })

  it('人 <-> 人 で入れ替わる', () => {
    const s = useSeatStore.getState()
    const a = s.addPerson('A')
    const b = s.addPerson('B')
    s.placeContent(0, 0, { type: 'person', personId: a })
    s.placeContent(1, 1, { type: 'person', personId: b })

    s.swapCells({ row: 0, col: 0 }, { row: 1, col: 1 })

    const p = useSeatStore.getState().project
    expect(getCell(p.grid, 0, 0)?.content).toEqual({ type: 'person', personId: b })
    expect(getCell(p.grid, 1, 1)?.content).toEqual({ type: 'person', personId: a })
  })

  it('同一セルは no-op', () => {
    const s = useSeatStore.getState()
    const a = s.addPerson('A')
    s.placeContent(0, 0, { type: 'person', personId: a })

    s.swapCells({ row: 0, col: 0 }, { row: 0, col: 0 })

    const p = useSeatStore.getState().project
    expect(getCell(p.grid, 0, 0)?.content).toEqual({ type: 'person', personId: a })
  })
})

describe('mergeCell 方向', () => {
  beforeEach(reset)

  it('左と結合すると左のセルがマスターになる', () => {
    const s = useSeatStore.getState()
    s.mergeCell({ row: 1, col: 1 }, 'left')
    const p = useSeatStore.getState().project
    expect(getCell(p.grid, 1, 0)?.colSpan).toBe(2)
    expect(getCell(p.grid, 1, 1)?.hidden).toBe(true)
  })

  it('上と結合すると上のセルがマスターになる', () => {
    const s = useSeatStore.getState()
    s.mergeCell({ row: 1, col: 1 }, 'up')
    const p = useSeatStore.getState().project
    expect(getCell(p.grid, 0, 1)?.rowSpan).toBe(2)
    expect(getCell(p.grid, 1, 1)?.hidden).toBe(true)
  })

  it('下と結合してから解除で元に戻る', () => {
    const s = useSeatStore.getState()
    s.mergeCell({ row: 0, col: 0 }, 'down')
    expect(getCell(useSeatStore.getState().project.grid, 0, 0)?.rowSpan).toBe(2)
    s.unmergeCell({ row: 0, col: 0 })
    const p = useSeatStore.getState().project
    expect(getCell(p.grid, 0, 0)?.rowSpan).toBe(1)
    expect(getCell(p.grid, 1, 0)?.hidden).toBeFalsy()
  })
})
