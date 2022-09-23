import { nothing } from './internal/nothing.js'
import { noop } from '../util.js'

export const completed = f => f(_completed)

const _completed = {
	complete: completed,
	observe: () => noop,
	settled: true,
	time: Symbol(),
	value: nothing
}
