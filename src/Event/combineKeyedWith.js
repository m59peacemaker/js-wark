import { combineAllWith } from './combineAllWith.js'

export const combineKeyedWith = f => events => {
	const keys = Object.keys(events)
	return combineAllWith (o => f(Object.entries(o).reduce((acc, [ k, v ]) => Object.assign(acc, { [keys[k]]: v }), {}))) (Object.values(events))
}
