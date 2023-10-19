import { map as _map } from '../Occurrences/map.js'
import { filter as _filter } from '../Occurrences/filter.js'
import { switching as _switching } from '../Occurrences/switching.js'
import { switch_updating as _switch_updating } from '../Occurrences/switch_updating.js'
import { hold } from '../Occurrences/hold.js'
import { lift2 } from '../Variable/lift2.js'
import { chain } from '../Variable/chain.js'
import { of } from '../Variable/of.js'
import { get_value, get_computation, is_occurring } from '../Occurrences/internal/computation.js'

const and = a => b => a && b

export const switch_updating = resolve => initial_focused_event => source_event => {
	if (source_event.is_complete.perform()) {
		return never
	}

	let focused_event = initial_focused_event
	let is_complete = false
	let leave_focused_event_propagation = no_op
	let leave_focused_event_completion_propagation = no_op
	const dependants = new Map()

	const join_focused_event_propagation = () => {
		leave_focused_event_propagation = focused_event.join_propagation(instant => {
			for (const f of dependants.values()) {
				f(instant)
			}
		})
	}

	// TODO: also gotta think about how the compute functions play into this...
	const switch_focused_event = event => {
		leave_focused_event_propagation()
		leave_focused_event_completion_propagation()
		focused_event = event
		if (dependants.size > 0) {
			join_focused_event_propagation()
		}
		leave_focused_event_completion_propagation = focused_event.is_completes.updates.join_propagation(instant => {
			instant.post_computations.push(() => {
			// focused_event_is_complete = true
				leave_focused_event_propagation()
				leave_focused_event_completion_propagation()
			})
		})
	}

	const self = {
		compute: instant => {
			const source_event_computation = get_computation(source_event, instant)
			if (!source_event_is_complete && is_occurring(source_event_computation)) {
				const focusing_event = get_value(source_event_computation)

				instant.post_computations.push(() => {
					switch_focused_event(focusing_event)
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
		join_propagation: f => {
			const id = Symbol()
			dependants.set(id, f)
			if (dependants.size === 1) {
				join_focused_event_propagation()
			}
			return () => {
				dependants.delete(id)
				if (dependants.length === 0) {
					leave_focused_event_propagation()
					leave_focused_event_propagation = no_op
				}
			}
		}
	}

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
	})

	const leave_source_event_completion_propagation = source_event.is_complete.updates.join_propagation(instant => {
		instant.post_computations.push(instant => {
			// source_event_is_complete = true
			leave_source_event_propagation()
			leave_source_event_completion_propagation()
			unregister_finalizer()
		})
	})

	const unregister_finalizer = register_finalizer(self, leave_source_event_propagation)

	return [
		self,
		leave_source_event_propagation
		// () => leave_focused_event_propagation()
	]
}
