import { never } from './never.js'
import { switching } from './switching.js'
import { map } from './map.js'

// TODO: efficient filter implementation (see map.js)

export const filter = f => event =>
	switching
		(map
			(x => f (x) ? event : never)
			(event)
		)
