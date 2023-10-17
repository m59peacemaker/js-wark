import { alt } from '../Occurrences/alt.js'
import { map } from '../Occurrences/map.js'
import { sampling } from '../Occurrences/sampling.js'
import { switch_updating } from '../Occurrences/switch_updating.js'
import { immediately } from '../immediately.js'
import { get_computation, get_value, is_occurring } from '../Occurrences/internal/computation.js'
import { undetermined } from './internal/undetermined.js'
import { register_finalizer } from '../finalization.js'

export const join = x => {
	let value = undetermined

	const updates = alt
		(switch_updating (immediately) (x.perform().updates) (map (x => x.updates) (x.updates)))
		(sampling (x.updates))

	const self = {
		updates,
		perform: () => {
			if (value === undetermined) {
				value = x.perform().perform()
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
