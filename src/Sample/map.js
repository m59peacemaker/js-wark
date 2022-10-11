import { construct } from './construct.js'

export const map = f => x =>
	construct (
		instant =>
			f (x.run(instant))
	)
