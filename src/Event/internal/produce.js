import { nothing } from './nothing.js'
import { compute_observers } from './compute_observers.js'
import { pre_compute_observers } from './pre_compute_observers.js'

export const produce = (event, value) => {
	const time = Symbol()
	event.time = time
	event.value = value
	const post_propagation = new Set()
	event.propagation = { time, post_propagation }
	pre_compute_observers(event, false)
	compute_observers(event)
	event.value = nothing
	for (const f of post_propagation) {
		f()
	}
}
