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

	// TODO: name stuff, or better yet, implement this directly instead of by composition
	const [ a, _a ] = switch_updating (immediately) (x.perform().updates) (map (x => x.updates) (x.updates))
	const updates = alt
		(a)
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

	const cleanup = () => {
		leave_propagation()
		_a()
	}

	register_finalizer(self, cleanup)

	return [ self, cleanup ]
}
