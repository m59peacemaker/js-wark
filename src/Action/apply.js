import { construct } from './construct.js'

export const apply = xf => xv =>
	construct (
		instant =>
			xf.run(instant) (xv.run(instant))
	)
