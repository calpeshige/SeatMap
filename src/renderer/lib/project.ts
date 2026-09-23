import { SEAT_FILE_VERSION, type SeatProject } from '@shared/types'
import { makeEmptyCells } from './grid'
import { uid } from './id'

/** 元の紙の座席表を意識した初期サンプル（起動直後にすぐ試せるように） */
export function createSampleProject(): SeatProject {
  const now = new Date().toISOString()
  const ranks = [
    { id: uid('rank:'), name: '課長', color: '#f6c343', order: 0 }, // 黄
    { id: uid('rank:'), name: '主任', color: '#a8d08d', order: 1 }, // 緑
    { id: uid('rank:'), name: '一般', color: '#f4b183', order: 2 }, // オレンジ
    { id: uid('rank:'), name: '新人', color: '#9dc3e6', order: 3 }, // 青
  ]

  return {
    version: SEAT_FILE_VERSION,
    meta: { title: '新しい座席表', createdAt: now, updatedAt: now },
    grid: { rows: 6, cols: 8, cells: makeEmptyCells(6, 8) },
    ranks,
    people: [],
    facilities: [],
  }
}

export function createEmptyProject(rows = 6, cols = 8): SeatProject {
  const now = new Date().toISOString()
  return {
    version: SEAT_FILE_VERSION,
    meta: { title: '新しい座席表', createdAt: now, updatedAt: now },
    grid: { rows, cols, cells: makeEmptyCells(rows, cols) },
    ranks: [],
    people: [],
    facilities: [],
  }
}
