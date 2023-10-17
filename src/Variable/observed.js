import { register_finalizer } from '../finalization.js'
import { get_computation, is_occurring } from '../Occurrences/internal/computation.js'

// toggle (false) (take (1) (occurrences))
export const observed = occurrences => {
	let value = false

	const self = {
		updates: occurrences,
		perform: () => value
	}

	const leave_propagation = occurrences.join_propagation(instant => {
		instant.post_computations.push(instant => {
			const computation = get_computation(occurrences, instant)
			if (is_occurring(computation)) {
				value = true
				leave_propagation()
			}
		})
	})

	register_finalizer(self, leave_propagation)

	return self
}
