import { register_finalizer } from '../finalization.js'
import { get_computation, is_occurring } from '../Occurrences/internal/computation.js'
import { map } from '../Occurrences/map.js'

// toggle (false) (take (1) (occurrences))
export const observed = occurrences => {
	let value = false

	const self = {
		// TODO: inline this instead of using `map`
		updates: map (() => true) (occurrences),
		perform: () => value
	}

	const compute_update = instant => {
		const computation = get_computation(occurrences.compute, instant)
		if (is_occurring(computation)) {
			instant.post_computations.push(instant => {
				value = true
				leave_propagation()
			})
		}
	}

	const leave_propagation = occurrences.join_propagation(instant => {
		get_computation(compute_update, instant)
	})

	register_finalizer(self, leave_propagation)

	return self
}
