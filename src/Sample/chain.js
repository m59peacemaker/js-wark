import { create } from './create.js'

export const chain = f => s =>
	create (time => f (s.run (time)).run (time))
