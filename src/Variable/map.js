import { map as _map } from '../Occurrences/map.js'
import { get_computation, get_value, is_occurring } from '../Occurrences/internal/computation.js'
import { undetermined } from './internal/undetermined.js'
import { register_finalizer } from '../finalization.js'

export const map = f => x => {
	let value = undetermined

	const updates = _map (f) (x.updates)

	const self = {
		updates,
		perform: () => {
			if (value === undetermined) {
				value = f(x.perform())
			}
			return value
		}
	}

	const leave_propagation = updates.join_propagation(instant => {
		instant.post_computations.push(instant => {
			const computation = get_computation(updates, instant)
			if (is_occurring(computation)) {
				if ('value' in computation) {
					value = computation.value
				} else {
					value = undetermined
				}
			}
		})
	})

	register_finalizer(self, leave_propagation)

	return [ self, leave_propagation ]
}
