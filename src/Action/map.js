import { construct } from './construct.js'

export const map = f => action =>
	construct (
		instant =>
			f (action.run(instant))
	)
