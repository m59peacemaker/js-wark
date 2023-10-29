import { map } from './map.js'
import { get_computation, get_value, is_occurring } from './internal/computation.js'

export const calling = f => x => {
	const self = {
		compute: instant => {
			const x_computation = get_computation(x.compute, instant)
			return is_occurring(x_computation)
				?
					() => f(get_value(x_computation))
				:
					false
		},
		join_propagation: x.join_propagation
	}

	const leave_propagation = x.join_propagation(instant => {
		const computation = get_computation(self.compute, instant)
		if (is_occurring(computation)) {
			get_value(computation)
		}
	})

	return [ self, leave_propagation ]
}
