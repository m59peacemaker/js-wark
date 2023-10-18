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

// TODO: return never if already complete
export const switch_updating = resolve => initial_focused_event => source_event => {
	const [ focused_event, a ] = hold (initial_focused_event) (source_event.occurrences)
	const [ focused_event_is_complete, b ] = chain (x => x.is_complete) (focused_event)
	const [ _is_complete, c ] = lift2 (and) (focused_event_is_complete) (source_event.is_complete)
	const is_complete_updates = _filter (x => x === true) (_is_complete.updates)
	const [ is_complete, d ] = hold (_is_complete.perform()) (is_complete_updates)
	const [ occurrences, e ] = _switch_updating
		(resolve)
		(initial_focused_event.occurrences)
		(_map (x => x.occurrences) (source_event.occurrences))

	const leave_source_event_completion_propagation = source_event.is_complete.updates.join_propagation(instant => {
		instant.post_computations.push(instant => {
			if (is_occurring(get_computation(source_event.is_complete.updates, instant))) {
				leave_source_event_completion_propagation()
				a()
				b()
				e()
			}
		})
	})

	const leave_completion_propagation = is_complete.updates.join_propagation(instant => {
		instant.post_computations.push(instant => {
			if (is_occurring(get_computation(is_complete.updates, instant))) {
				// a()
				// b()
				// c()
				// d()
				// e()
				// leave_completion_propagation()
			}
		})
	})

	return {
		occurrences,
		is_complete
	}
}
