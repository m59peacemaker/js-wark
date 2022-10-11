import { map } from './map.js'
import { switching } from './switching.js'

export const map_switching = f => event => switching (map (f) (event))
