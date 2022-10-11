import { construct } from './construct.js'

export const chain = f => s =>
	construct (instant => f (s.run (instant)).run (instant))
