import { nothing } from './internal/nothing.js'
import { noop } from '../util.js'

const registry = new FinalizationRegistry(unobserve => unobserve())

export const hold = initial_value => event => {
	let value = initial_value

	const unobserve = event.observe({
		pre_compute: () => {},
		compute: () => {
			if (event.value !== nothing) {
				value = event.value
			}
		}
	})
	/*
		NOTE: In the implementation, whether an Event is complete can be checked by `event.complete.time !== null`.
		Statefully observing an event requires also observing its complete event,
		so that the complete event's occurrence time property is updated when it should occur.
	*/
	const unobserve_complete = event.complete.observe({
		pre_compute: noop,
		compute: () => {
			if (event.complete.value !== nothing) {
				// TODO: this breaks garbage collection because it references `self`... so does this need to be done differently or is it unnecessary?
				// registry.unregister(self)
				unobserve()
				unobserve_complete()
			}
		}
	})

	const self = {
		run: () => value,
		updates: event
	}

	registry.register(self, () => {
		unobserve()
		unobserve_complete()
	})

	return self
}
