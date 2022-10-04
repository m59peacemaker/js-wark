import { count } from './count.js'
import { take_until_true } from './take_until_true.js'
import { map } from '../Dynamic/map.js'
import { nothing } from './internal/nothing.js'
import { catch_up_observer } from './internal/catch_up_observer.js'
import { compute_observers } from './internal/compute_observers.js'
import { pre_compute_observers } from './internal/pre_compute_observers.js'
import { _take_until } from './take_until.js'
import { _call } from '../Reference/call.js'
import { _use } from '../Reference/use.js'

const registry = new FinalizationRegistry(unobserve => unobserve())

/*
	Number => Event X => Event X
	Takes a number, `n`, and an Event, `a` and returns an Event with the same occurrences as Event `a`, until it completes or it has occurred `n` times, whichever comes first.
*/

/* TODO: test high level / minimal-byte implementation */
// export const take = n => event =>
// 	take_until
// 		(alt
// 			(complete (event))
// 			(nth (n) (event))
// 		)
// 		(event)

	// (take_until_true
	// 	(map
	// 		(x => x === n)
	// 		(count (event))
	// 	)
	// 	(event)

export const _take = (n, input_event, input_event_complete) => {
	const observers = new Map()

	let i = 0

	const self = {
		observers,
		settled: true,
		time: null,
		value: nothing,
		observe: observer => {
			const id = Symbol()
			observers.set(id, observer)

			catch_up_observer (self, observer, false)

			return () => observers.delete(id)
		}
	}

	const dependency_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			if (!self.settled) {
				return
			}
			self.propagation = dependency.propagation
			self.settled = false
			pre_compute_observers(self, cycle_allowed)
		},
		compute: () => {
			if (self.settled) {
				return
			}
			const { time, post_propagation } = self.propagation
			if (input_event.settled && input_event_complete.settled) {
				self.settled = true
				if (input_event.value !== nothing) {
					++i
				}
				if (i === n || input_event_complete.value !== nothing) {
					self.time = time
					self.value = input_event.value !== nothing ? input_event.value : input_event_complete.value
					post_propagation.add(() => {
						self.value = nothing
						unobserve_input_event()
						unobserve_input_complete_event()
					})
				}
				compute_observers(self)
			}
		}
	}

	self.complete = self

	let unobserve_input_event
	let unobserve_input_complete_event

	_call(input_event.observe, input_event_observe =>
		_call(input_event_complete.observe, input_event_complete_observe => {
			unobserve_input_event = input_event_observe(dependency_observer)
			unobserve_input_complete_event = input_event_complete_observe(dependency_observer)

			registry.register(self, () => {
				unobserve_input_event()
				unobserve_input_complete_event()
			})
		})
	)

	return _take_until(self, input_event)
}

export const take = n => input_event =>
	_use(input_event, input_event =>
		_use(input_event.complete, input_event_complete =>
			_take(n, input_event, input_event_complete)
		)
	)
