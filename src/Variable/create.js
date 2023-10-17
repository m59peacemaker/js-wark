import { create as _create } from '../Occurrences/create.js'
import { hold } from '../Occurrences/hold.js'

export const create = x => hold (x) (_create()) [0]
