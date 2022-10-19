import { _nothing } from './internal/_nothing.js'
import { register_finalizer } from '../finalization.js'
import { get_value } from './internal/get_value.js'
import { get_value_with_cache } from './internal/get_value_with_cache.js'
import { no_op } from '../util/no_op.js'
// import { Error_Cycle_Detected } from './Error_Cycle_Detected.js'

export const switch_updating = resolve => initial_focused_event => source_event => {
	let focused_event = initial_focused_event
	let observers = 0
	let stop_observing_focused_event = no_op
	let leave_focused_event_propagation = no_op
	const dependants = new Map()

	const propagate = instant => {
		if (!instant.cache.has(self)) {
			const cache = { computed: false, value: _nothing }
			instant.cache.set(self, cache)
			for (const f of dependants.values()) {
				f(instant)
			}
			// Ensure this computes, regardless of dependants.
			instant.computations.push(instant => get_value_with_cache(instant, cache, self))
		}
	}

	const self = {
		instant: () => initial_focused_event.instant() || source_event.instant(),
		compute: instant => {
			const focusing_event = get_value(instant, source_event)
			if (focusing_event === _nothing) {
				return get_value (instant, focused_event)
			} else {
				instant.post_computations.push(() => {
					stop_observing_focused_event()
					leave_focused_event_propagation()
					leave_focused_event_propagation = focusing_event.join_propagation(propagate)
					focused_event = focusing_event
					if (observers !== 0) {
						stop_observing_focused_event = focused_event.observe()
					}
				})
				const resolve_event = resolve (focused_event) (focusing_event)
				return get_value (instant, resolve_event)
			}
		},
		observe: () => {
			++observers
			if (observers === 1) {
				stop_observing_focused_event = focused_event.observe()
			}
			return () => {
				--observers
				if (observers === 0) {
					stop_observing_focused_event()
				}
			}
		},
		join_propagation: f => {
			const id = Symbol()
			dependants.set(id, f)
			return () => dependants.delete(id)
		}
	}

	const stop_observing_source_event = source_event.observe()
	const leave_source_event_propagation = source_event.join_propagation(propagate)
	leave_focused_event_propagation = focused_event.join_propagation(propagate)

	register_finalizer(self, () => {
		stop_observing_source_event()
		stop_observing_focused_event()
		leave_source_event_propagation()
		leave_focused_event_propagation()
	})

	const instant = self.instant()
	if (instant !== null) {
		// TODO: rename cache to state
		const cache = { computed: false, value: _nothing }
		instant.cache.set(self, cache)
		instant.computations.push(instant => get_value_with_cache(instant, cache, self))
	}

	return self
}
