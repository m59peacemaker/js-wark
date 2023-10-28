import { never } from '../Event/never.js'

export const of = value => ({
	perform: () => value,
	updates: never
})
