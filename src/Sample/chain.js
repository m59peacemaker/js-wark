import { construct } from './construct.js'

export const chain = f => x =>
	construct (instant => f (x.perform(instant)).perform(instant))
