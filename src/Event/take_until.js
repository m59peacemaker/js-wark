import { noop } from '../util.js'
import { nothing } from './internal/nothing.js'
import { _use } from '../reference.js'

/*
	Event X => Event Y => Event Y
	Takes an Event, `a`, and an Event, `b`, and returns an Event with the same occurrences as Event `b` until Event `a` occurs, and completes when Event `a` occurs.
*/

/*
	The complete event of the returned event is nearly the same as the input complete_event,
	except it needs its complete event to be itself,
	and it needs to occur only once.
	The input complete event may occur many times,
	but it isn't necessary to derive a new event for this purpose.
	Instead, `performing` observes the complete event of its input event
	and unobserves the input event and its complete event when the complete event occurs.
*/
/*
	From a high level perspective, `take_until` returns an Event with a Dynamic `is_complete` that updates to `true` when `complete_event` occurs.
	`take_until` must therefore observe the complete_event so that it can be known whether it has occurred even though it may not have any other observers.
*/

const registry = new FinalizationRegistry(unobserve => unobserve())

/*
	TODO: perhaps rename this to `complete_when` and make `take_until = x => y => alt (x) (complete (y))`
	Otherwise, there is an inconsistency with `take (n) (x)`, if it completes or the nth occurrence OR when `x` completes
*/

export const _take_until = (complete_event, input_event) => {
	const complete = {
		get observers () { return complete_event.observers },
		get settled () { return complete_event.settled },
		get time () { return complete_event.time },
		get value () { return complete_event.value },
		get observe () { return complete_event.observe },
		get propagation () { return complete_event.propagation },
		get referenced () { return complete_event }
	}
	complete.complete = complete
	const unobserve = complete_event.observe({
		pre_compute: noop,
		compute: () => {
			if (complete_event.value !== nothing) {
				// TODO: this breaks garbage collection because it references `self`... so does this need to be done differently or is it unnecessary?
				// registry.unregister(complete)
				unobserve()
			}
		}
	})
	registry.register(complete, unobserve)
	return {
		complete,
		get observers () { return input_event.observers },
		get settled () { return input_event.settled },
		get time () { return input_event.time },
		get value () { return input_event.value },
		get observe () { return input_event.observe },
		get propagation () { return input_event.propagation },
		get referenced () { return input_event }
	}
}

export const take_until = complete_event => input_event =>
	_use(complete_event, complete_event =>
		_use(input_event, input_event =>
			_take_until(complete_event, input_event)
		)
	)

// export const _take_until = complete_event => input_event => {
// 	let unobserve_dependencies

// 	const input_event_observer = {
// 		pre_compute: () => self.settled = false,
// 		compute: (time, propagate, post_propagation) => {
// 			self.settled = true
// 			if (input_event.value !== nothing) {
// 				self.time = time
// 				self.value = input_event.value
// 				post_propagation.add(() => self.value = nothing)
// 			}
// 			propagate(self.observers)
// 		}
// 	}

// 	const complete_event_observer = {
// 		pre_compute: () => {},
// 		compute: () => {
// 			if (complete_event.settled) {
// 				if (complete_event.value !== nothing) {
// 					unobserve_dependencies()
// 				}
// 			}
// 		}
// 	}

// 	const complete = {
// 		get observers () { return complete_event.observers },
// 		get settled () { return complete_event.settled },
// 		get time () { return complete_event.time },
// 		get value () { return complete_event.value },
// 		get observe () { return complete_event.observe }
// 	}
// 	complete.complete = complete

// 	const self = {
// 		complete,
// 		observers: new Set(),
// 		settled: true,
// 		time: null,
// 		value: nothing,
// 		observe: observer => {
// 			observer = { ...observer }
// 			self.observers.add(observer)
// 			if (self.observers.size === 1) {
// 				unobserve_dependencies = pipe2(
// 					input_event.observe(input_event_observer),
// 					complete_event.observe(complete_event_observer)
// 				)
// 			}
// 			return () => {
// 				self.observers.delete(observer)
// 				if (self.observers.size === 0) {
// 					unobserve_dependencies()
// 				}
// 			}
// 		}
// 	}

// 	return self
// }
