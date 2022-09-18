import { nothing } from './internal/nothing.js'
import { noop } from '../util.js'

export const completed = (
	completed => {
		completed.complete = completed
		return Object.freeze(completed)
	}
)({
	settled: true,
	time: Symbol(),
	value: nothing,
	observe: () => noop
})
