import { nothing } from './internal/nothing.js'
import { noop } from '../util.js'
import { completed } from './completed.js'

export const never = ({
	complete: completed,
	settled: true,
	time: null,
	value: nothing,
	observe: () => noop
})
