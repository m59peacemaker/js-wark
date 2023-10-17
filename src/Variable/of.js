import { never_occurs } from '../Occurrences/never_occurs.js'

export const of = value => ({
	updates: never_occurs,
	perform: () => value
})
