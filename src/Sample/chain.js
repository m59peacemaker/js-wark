import { construct } from './construct.js'

export const chain = f => s =>
	construct (time => f (s.run (time)).run (time))
