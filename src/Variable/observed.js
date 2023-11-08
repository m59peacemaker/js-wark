import { get_computation, is_occurring } from '../Occurrences/internal/computation.js'
import { register_finalizer } from '../lib/finalization.js'

// toggle (false) (take (1) (occurrences))
export const observed = occurrences => {
	let value = false

	const self = {
		updates: {
			compute: instant =>
				is_occurring(get_computation(occurrences.compute, instant)) && (() => true)
			,
			join_propagation: occurrences.join_propagation
		},
		perform: () => value
	}

	const compute_update = instant => {
		const computation = get_computation(occurrences.compute, instant)
		if (is_occurring(computation)) {
			instant.post_computations.push(instant => {
				value = true
				leave_propagation()
				unregister_finalizer()
			})
		}
	}

	const leave_propagation = occurrences.join_propagation(instant => {
		/*
			TODO: if this function can only ever be called once per instant,
			call the code from `compute_update` directly in here rather than using get_computation
		*/
		get_computation(compute_update, instant)
	})

	const unregister_finalizer = register_finalizer(self, leave_propagation)

	return self
}
