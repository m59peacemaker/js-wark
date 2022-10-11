import { calling } from './calling.js'

export const performing = f => event =>
	calling
		(x => f (x).run (event.computed))
		(event)
