import { nothing } from './internal/nothing.js'
import { catch_up_observer } from './internal/catch_up_observer.js'
import { pre_compute_observers } from './internal/pre_compute_observers.js'
import { compute_observers } from './internal/compute_observers.js'

export const calling = f => input_event => {
	const observers = new Map()

	const self = {
		complete: input_event.complete,
		observers,
		settled: true,
		time: null,
		value: nothing,
		observe: observer => {
			const id = Symbol()

			catch_up_observer(self, observer, false)

			observers.set(id, observer)
			return () => observers.delete(id)
		}
	}

	const unobserve_input_event = input_event.observe({
		pre_compute: (dependency, cycle_allowed) => {
			self.propagation = dependency.propagation
			self.settled = false
			pre_compute_observers(self, cycle_allowed)
		},
		compute: () => {
			const { time, post_propagation } = self.propagation
			if (self.settled) {
				return
			}
			self.settled = true
			if (input_event.value !== nothing) {
				self.time = time
				self.value = f (input_event.value)
				post_propagation.add(() => self.value = nothing)
			}
			compute_observers(self)
		}
	})

	/*
		This is the essence of the implementation of `complete_when`.
		The `complete` property of an event may actually be an event that occurs many times,
		but only one occurrence of a complete event is observed,
		making it effectively true that the complete event only occurs once.
	*/
	let complete_propagation
	const unobserve_input_event_complete_event = input_event.complete.observe({
		pre_compute: dependency => {
			complete_propagation = dependency.propagation
		},
		compute: () => {
			if (input_event.complete.value !== nothing) {
				complete_propagation.post_propagation.add(() => {
					unobserve_input_event()
					unobserve_input_event_complete_event()
				})
			}
		}
	})

	return self
}
