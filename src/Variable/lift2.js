import { merge_2_with as _merge_2_with } from '../Occurrences/merge_2_with.js'
import { get_computation, get_value, is_occurring } from '../Occurrences/internal/computation.js'
import { undetermined } from './internal/undetermined.js'
import { register_finalizer } from '../finalization.js'
import { nothing } from '../Occurrences/nothing.js'

export const lift2 = f => x => y => {
	let value = undetermined

	// TODO: inline instead of derive
	const updates = _merge_2_with
		(a => b =>
			f
				(a === nothing ? x.perform() : a)
				(b === nothing ? y.perform() : b)
		)
		(x.updates)
		(y.updates)

	const self = {
		updates,
		perform: () => {
			if (value === undetermined) {
				value = f (x.perform()) (y.perform())
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
