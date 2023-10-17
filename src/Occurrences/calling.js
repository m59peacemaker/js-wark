import { map } from './map.js'
import { get_computation, get_value, is_occurring } from './internal/computation.js'

export const calling = f => x => {
	const self = map (f) (x)

	const leave_propagation = x.join_propagation(instant => {
		instant.computations.push(instant => {
			const computation = get_computation(self, instant)
			if (is_occurring(computation)) {
				get_value(computation)
			}
		})
	})

	return [ self, leave_propagation ]
}
