import { nothing } from './internal/nothing.js'
import { noop } from '../util.js'

export const completed = (x => {
	x.complete = x
	return x
})({
	observe: () => noop,
	settled: true,
	time: Symbol(),
	value: nothing
})
