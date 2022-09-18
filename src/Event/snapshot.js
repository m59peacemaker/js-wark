import { map } from './map.js'

export const snapshot = f => sample => event =>
	map
		(x => f (sample.run (event.time)) (x))
		(event)
