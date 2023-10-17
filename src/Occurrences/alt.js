import { merge_2_with } from './merge_2_with.js'
import { nothing } from './nothing.js'

export const alt = merge_2_with (a => b => a === nothing ? b : a)
