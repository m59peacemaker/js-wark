import { map as Occurrences_map } from '../Occurrences/map.js'
import { get_computation, get_value, is_occurring } from '../Occurrences/internal/computation.js'
import { undetermined } from './internal/undetermined.js'
import { register_finalizer } from '../finalization.js'
import { never } from '../Event/never.js'

export const map = f => x => {
	let value = undetermined
	
	const perform = () => {
		if (value === undetermined) {
			value = f(x.perform())
		}
		return value
	}

	if (x.updates.is_complete.perform()) {
		return {
			updates: never,
			perform
		}
	}

	const updates_occurrences = Occurrences_map (f) (x.updates.occurrences)

	const leave_propagation = updates_occurrences.join_propagation(instant => {
		const computation = get_computation(updates_occurrences.compute, instant)
		/*
			Check `is_occurring` during regular computation phase,
			so as not to race with with state changes in the post computation phase.
		*/
		if (is_occurring(computation)) {
			instant.post_computations.push(() => {
				/*
					Check whether a value was cached during the post computation phase,
					so as not to race with it being computed and cached during the computation phase.
				*/
				if ('value' in computation) {
					value = computation.value
				} else {
					value = undetermined
				}
			})
		}
	})

	const leave_completion_propagation = x.updates.is_complete.updates.join_propagation(instant => {
		if (is_occurring(x.updates.is_complete.updates.compute, instant)) {
			instant.post_computations.push(() => {
				leave_propagation()
				leave_completion_propagation()
				unregister_finalizer()
			})
		}
	})

	const updates = {
		occurrences: updates_occurrences,
		is_complete: x.updates.is_complete
	}

	const unregister_finalizer = register_finalizer(updates, () => {
		leave_propagation()
		leave_completion_propagation()
	})

	return {
		perform,
		updates
	}
}
