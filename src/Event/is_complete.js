import { map } from './map.js'
import { _use } from '../reference.js'

const uninitialized = Symbol()

export const _is_complete = event => {
	let callers = []
	let value = uninitialized
	const updates = map
		(() => {
			value = true
			for (const f of callers) {
				f()
			}
			callers = []
			return value
		})
		(event.complete)

	const compute = (time, f) => {
		const x = () => f(value = value === uninitialized ? event.complete.time !== null : value)
		event.complete.settled
			? x()
			: callers.push(x)
	}

	return {
		compute,
		run: () => {
			compute(Symbol(), x => value = x)
			return value
		},
		updates
	}
}

export const is_complete = event =>
	_use(event, _is_complete)
