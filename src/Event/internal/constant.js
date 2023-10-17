import { never_occurs } from './never_occurs.js'

export const constant = value => ({
	perform: () => value,
	updates: never_occurs
})
