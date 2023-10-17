import { get_computation, get_value, is_occurring } from './internal/computation.js'
import { register_finalizer } from '../finalization.js'
import { no_op } from '../util/no_op.js'
// import { computed_in_instant } from './internal/computed_in_instant.js'
// import { Error_Cycle_Detected } from './Error_Cycle_Detected.js'

/*
	Switch must observe its source event even if nothing is observing it, because when something begins observing the switch, it must know its current focused_event.
	Observing the source event to determine focused_event is semantically the same as `focused_event = hold initial_focused_event source_event`.

	const focused_event = hold (initial_focused_event) (source_event)

	But if `focused_event` is `Dynamic Event X`, with its updates being `Event Event X`, then it seems like this very switch operator would be necessary to make that Event X.

	However, there is the question of resolving the occurrence value at the moment of the switch.

	updates (Dynamic.switch) (scan (resolve) (current (focused_event)) (updates (focused_event)))
*/

/*
	Switch must observe its source event even if nothing is observing it, because when something begins observing the switch, it must know its current focused_event.
*/

export const switch_updating = resolve => initial_focused_event => source_event => {
	let focused_event = initial_focused_event
	// let observers = 0
	// let stop_observing_focused_event = no_op
	let leave_focused_event_propagation = no_op
	const dependants = new Map()

	// const on_source_event_propagation = instant => {
	// 	instant.computations.push(instant => {
	// 		if (computed_in_instant(instant, source_event.updates)) {
	// 			const update_value = get_value(instant, source_event.updates)
	// 			if (update_value !== _nothing) {
	// 				focusing_event = update_value
	// 				instant.post_computations.push(() => {
	// 					focused_event = focusing_event
	// 					focusing_event = null
	// 				})
	// 			}
	// 		}
	// 	})
	// }

	const self = {
		compute: instant => {
			const source_event_computation = get_computation(source_event, instant)
			// const focusing_event = get_value(source_event_computation)
			if (is_occurring(source_event_computation)) {
				const focusing_event = get_value(source_event_computation)
				instant.post_computations.push(() => {
					leave_focused_event_propagation()
					focused_event = focusing_event
					if (dependants.size > 0) {
						leave_focused_event_propagation = focused_event.join_propagation(instant => {
							for (const f of dependants.values()) {
								f(instant)
							}
						})
					}
				})
				const resolved_event = resolve (focused_event) (focusing_event)
				const resolved_event_computation = get_computation(resolved_event, instant)
				return is_occurring(resolved_event_computation)
					?
						() => get_value(resolved_event_computation)
					:
						false
			} else {
				const focused_event_computation = get_computation(focused_event, instant)
				return is_occurring(focused_event_computation)
					?
						() => get_value (focused_event_computation)
					:
						false
			}
		},
		// observe: () => {
		// 	++observers
		// 	if (observers === 1) {
		// 		stop_observing_focused_event = focused_event.observe()
		// 	}
		// 	return () => {
		// 		--observers
		// 		if (observers === 0) {
		// 			stop_observing_focused_event()
		// 		}
		// 	}
		// },
		join_propagation: f => {
			// const leave_source_event_propagation = source_event.join_propagation(f)
			const id = Symbol()
			dependants.set(id, f)
			if (dependants.size === 1) {
				leave_focused_event_propagation = focused_event.join_propagation(instant => {
					for (const f of dependants.values()) {
						f(instant)
					}
				})
			}
			return () => {
				dependants.delete(id)
				if (dependants.length === 0) {
					leave_focused_event_propagation()
					leave_focused_event_propagation = no_op
				}
				// leave_source_event_propagation()
				// leave_focused_event_propagation()
				// leave_source_event_propagation()
				// focused_event_listeners.get(f) // TODO: remove one and call it?
			}
		}
	}

	// const stop_observing_source_event = source_event.observe()
	const leave_source_event_propagation = source_event.join_propagation(instant => {
		for (const f of dependants.values()) {
			f(instant)
		}
		instant.computations.push(instant => {
			const computation = get_computation(self, instant)
			if (is_occurring(computation)) {
				// Ensure this computes, regardless of dependants.
				get_value(computation)
			}
		})
		// if (!instant.cache.has(self)) {
		// 	const state = { computed: false, value: _nothing }
		// 	instant.cache.set(self, state)
		// 	// for (const f of dependants.values()) {
		// 	// 	f(instant)
		// 	// }
		// 	// Ensure this computes, regardless of dependants.
		// 	instant.computations.push(instant => get_value_with_state(instant, state, self))
		// }
	})

	// leave_focused_event_propagation = focused_event.join_propagation(propagate)

	register_finalizer(self, () => {
		// stop_observing_source_event()
		// stop_observing_focused_event()
		leave_source_event_propagation()
		// leave_focused_event_propagation()
	})

	// const instant = self.instant
	// if (instant !== null) {
	// 	const state = { computed: false, value: _nothing }
	// 	instant.cache.set(self, state)
	// 	instant.computations.push(instant => get_value_with_state(instant, state, self))
	// }

	return self
}
