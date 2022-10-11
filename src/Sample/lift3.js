import { construct } from './construct.js'

export const lift2 = f => x1 => x2 => x3 =>
	construct (
		instant =>
			f
				(x1.run(instant))
				(x2.run(instant))
				(x3.run(instant))
	)
