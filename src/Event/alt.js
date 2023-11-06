import { merge_2 } from './merge_2.js'
import { nothing } from './nothing.js'

export const alt = merge_2 (y => x => x === nothing ? y : x)
