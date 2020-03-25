import { lift2 } from './lift2.js'
import { call } from '../util.js'

export const apply = bf => bv => lift2 (call) ([ bf, bv ])
