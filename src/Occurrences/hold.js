import { register_finalizer } from '../finalization.js'
import { get_computation, get_value, is_occurring } from '../Occurrences/internal/computation.js'

export const hold = initial_value => updates => {
	let value = initial_value

	const receive_update = instant => {
		instant.post_computations.push(instant => {
			const updates_computation = get_computation(updates, instant)
			if (is_occurring(updates_computation)) {
				value = get_value(updates_computation)
			}
		})
	}

	const self = {
		updates,
		perform: () => value
	}

	const leave_propagation = updates.join_propagation(receive_update)

	register_finalizer(self, leave_propagation)

	return [ self, leave_propagation ]
}
