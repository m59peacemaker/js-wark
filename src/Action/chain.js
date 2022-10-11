import { join } from './join.js'
import { map } from './map.js'

export const chain = f => x =>
	join (
		map (f) (x)
	)
