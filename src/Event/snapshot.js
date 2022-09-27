import { nothing } from './internal/nothing.js'
import { catch_up_observer } from './internal/catch_up_observer.js'
import { compute_observers } from './internal/compute_observers.js'
import { pre_compute_observers } from './internal/pre_compute_observers.js'
import { _use } from '../reference.js'

export const _snapshot = (f, sample, input_event) => {
	const observers = new Map()

	let unobserve_input_event

	const self = {
		complete: input_event.complete,
		observers,
		settled: true,
		time: null,
		value: nothing,
		observe: observer => {
			const id = Symbol()
			observers.set(id, observer)
			if (observers.size === 1) {
				_use(input_event.observe, input_event_observe => {
					unobserve_input_event = input_event_observe(input_event_observer)
				})
			}

			catch_up_observer (self, observer, false)

			return () => {
				observers.delete(id)
				if (observers.size === 0) {
					unobserve_input_event()
				}
			}
		}
	}

	const input_event_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			self.propagation = dependency.propagation
			self.settled = false
			pre_compute_observers(self, cycle_allowed)
		},
		compute: () => {
			const { time, post_propagation } = self.propagation
			// NOTE: if needed, Dynamic/Sample could have a callback api to fix timing issue, if the update is unsettled
			// sample.compute(time, x => {
			self.settled = true
			if (input_event.value !== nothing) {
				self.time = time
				self.value = f (sample.run(time)) (input_event.value)
				post_propagation.add(() => self.value = nothing)
			}
			compute_observers(self)
			// })
		}
	}

	return self
}

export const snapshot = f => sample => input_event =>
	_use(sample, sample =>
		_use(input_event, input_event =>
			_snapshot (f, sample, input_event)
		)
	)
