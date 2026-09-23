import { z } from 'zod'
import { SEAT_FILE_VERSION } from './types'

const rankSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  order: z.number(),
})

const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  rankId: z.string().nullable(),
  note: z.string().optional(),
})

const facilityKindSchema = z.enum([
  'emergency-exit',
  'whiteboard',
  'mfp',
  'shredder',
  'printer',
  'cabinet',
  'other',
])

const facilitySchema = z.object({
  id: z.string(),
  kind: facilityKindSchema,
  label: z.string().optional(),
})

const cellContentSchema = z.union([
  z.object({ type: z.literal('empty') }),
  z.object({ type: z.literal('person'), personId: z.string() }),
  z.object({ type: z.literal('facility'), facilityId: z.string() }),
])

const cellSchema = z.object({
  row: z.number(),
  col: z.number(),
  content: cellContentSchema,
})

const gridSchema = z.object({
  rows: z.number().int().positive(),
  cols: z.number().int().positive(),
  cells: z.array(cellSchema),
})

export const seatProjectSchema = z.object({
  version: z.literal(SEAT_FILE_VERSION),
  meta: z.object({
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  grid: gridSchema,
  ranks: z.array(rankSchema),
  people: z.array(personSchema),
  facilities: z.array(facilitySchema),
})
