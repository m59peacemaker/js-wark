import { nothing } from './internal/nothing.js'
import { noop } from '../util.js'
import { _use } from '../reference.js'
import { updating } from './updating.js'
import { eagerly } from './updating.js'

const registry = new FinalizationRegistry(unobserve => unobserve())

export const hold = updating (eagerly)

// const _hold = (initial_value, event, event_complete) => {
// 	let value = initial_value

// 	const unobserve = event.observe({
// 		pre_compute: () => {},
// 		compute: () => {
// 			if (event.value !== nothing) {
// 				value = event.value
// 			}
// 		}
// 	})
// 	/*
// 		NOTE: In the implementation, whether an Event is complete can be checked by `event.complete.time !== null`.
// 		Statefully observing an event requires also observing its complete event,
// 		so that the complete event's occurrence time property is updated when it should occur.
// 	*/
// 	const unobserve_complete = event_complete.observe({
// 		pre_compute: noop,
// 		compute: () => {
// 			if (event_complete.value !== nothing) {
// 				// TODO: this breaks garbage collection because it references `self`... so does this need to be done differently or is it unnecessary?
// 				// registry.unregister(self)
// 				unobserve()
// 				unobserve_complete()
// 			}
// 		}
// 	})

// 	// TODO:
// 	const self = {
// 		compute: (time, f) => {
// 			f (value)
// 		},
// 		run: time => {
// 			self.compute (time, noop)
// 			return value
// 		},
// 		updates: event
// 	}

// 	registry.register(self, () => {
// 		unobserve()
// 		unobserve_complete()
// 	})

// 	return self
// }

// export const hold = initial_value => event =>
// 	_use (event, event =>
// 		_use (event.complete, event_complete =>
// 			_hold(initial_value, event, event_complete)
// 		)
// 	)
