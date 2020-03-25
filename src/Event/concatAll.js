import { combineAllWith } from './combineAllWith.js'

export const concatAll = combineAllWith (o => {
	const values = Object.values(o)
	if (values.length > 1) {
		throw new Error('concat must not be called on events that can occur simultaneously!')
	}
	return values[0]
})
