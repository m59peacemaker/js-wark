import { map } from './map.js'
import { join } from './join.js'

export const chain = f => x => join (map (f) (x))
