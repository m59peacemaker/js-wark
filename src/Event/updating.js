import { nothing } from './internal/nothing.js'
import { noop } from '../util.js'
import { _call, _use } from '../reference.js'

// TODO: put these elsewhere
export const deferred = x => _ => x
export const eagerly = _ => y => y

const registry = new FinalizationRegistry(unobserve => unobserve())

export const _updating = (f, initial_value, event, event_complete) => {
	let value = initial_value

	// TODO:
	const self = {
		// compute: (time, f) => {
		// 	f (value)
		// },
		run: time => {
			if (!event.settled) {
				// TODO: better error after having a better handle on the possibilities
				throw new Error(`Either a self-referencing dynamic attempted to update using its own updated value, or there is a case where a dynamic's value is accessed while it is pending update.`)
			}
			// self.compute (time, noop)
			return value
		},
		updates: event
	}

	_call(event.observe, event_observe => {
		_call(event_complete.observe, event_complete_observe => {
			const unobserve = event_observe({
				pre_compute: () => {},
				compute: () => {
					if (event.value !== nothing) {
						value = f (value) (event.value)
						const next_value = event.value
						event.propagation.post_propagation.add(() => {
							value = next_value
						})
					}
				}
			})
			/*
				NOTE: In the implementation, whether an Event is complete can be checked by `event.complete.time !== null`.
				Statefully observing an event requires also observing its complete event,
				so that the complete event's occurrence time property is updated when it should occur.
			*/
			const unobserve_complete = event_complete_observe({
				pre_compute: noop,
				compute: () => {
					if (event_complete.value !== nothing) {
						// TODO: this breaks garbage collection because it references `self`... so does this need to be done differently or is it unnecessary?
						// registry.unregister(self)
						unobserve()
						unobserve_complete()
					}
				}
			})

			registry.register(self, () => {
				unobserve()
				unobserve_complete()
			})
		})
	})

	return self
}

export const updating = f => initial_value => event =>
	_use (event, event =>
		_use (event.complete, event_complete =>
			_updating(f, initial_value, event, event_complete)
		)
	)
