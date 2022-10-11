import { construct } from './construct.js'

export const join = action =>
	construct (
		instant =>
			action.run(instant).run(instant)
	)
