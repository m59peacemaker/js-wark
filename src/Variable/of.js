import { never } from '../Occurrences/never.js'

export const of = value => ({
	perform: () => value,
	updates: never
})
