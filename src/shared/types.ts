export const SEAT_FILE_VERSION = 1 as const

/** 階級/チーム区分（色ラベル）。ユーザーが自由に定義する */
export interface Rank {
  id: string
  name: string
  color: string // '#RRGGBB' マス背景色
  order: number // パレット表示順
}

/** 人。座標は持たない（どのセルに居るかは Cell 側が持つ） */
export interface Person {
  id: string
  name: string
  rankId: string | null // Rank.id 参照。null は未割当（既定色）
  note?: string // 手書きのメモ数字等。自由文字列
}

export type FacilityKind =
  | 'emergency-exit' // 非常扉
  | 'whiteboard' // ホワイトボード
  | 'mfp' // 複合機
  | 'shredder' // シュレッダー
  | 'printer' // プリンタ
  | 'cabinet' // キャビネット
  | 'other'

export interface Facility {
  id: string
  kind: FacilityKind
  label?: string // 表示名の上書き（kind 既定ラベルを使わない場合）
}

/** セルに入る中身。人 or 設備 or 空 */
export type CellContent =
  | { type: 'empty' }
  | { type: 'person'; personId: string }
  | { type: 'facility'; facilityId: string }

/** グリッド上の1マス。row/col は 0-based */
export interface Cell {
  row: number
  col: number
  content: CellContent
}

export interface Grid {
  rows: number
  cols: number
  /** rows*cols 個。並びは row-major。欠けたセルは empty で埋める */
  cells: Cell[]
}

/** プロジェクト全体 = .seat ファイルの中身そのもの */
export interface SeatProject {
  version: typeof SEAT_FILE_VERSION
  meta: {
    title: string
    createdAt: string // ISO8601
    updatedAt: string
  }
  grid: Grid
  ranks: Rank[]
  people: Person[] // マスタ。未配置の人もここに残す
  facilities: Facility[]
}

export const FACILITY_LABELS: Record<FacilityKind, string> = {
  'emergency-exit': '非常扉',
  whiteboard: 'ホワイトボード',
  mfp: '複合機',
  shredder: 'シュレッダー',
  printer: 'プリンタ',
  cabinet: 'キャビネット',
  other: 'その他',
}
