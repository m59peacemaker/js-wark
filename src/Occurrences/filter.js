import { get_computation, get_value, is_occurring } from './internal/computation.js'

export const filter = f => x => ({
	compute: instant => {
		const x_computation = get_computation(x.compute, instant)
		if (is_occurring(x_computation)) {
			const x_value = get_value(x_computation)
			return f(x_value)
				?
					() => x_value
				:
					false
		} else {
			return false
		}
	},
	join_propagation: x.join_propagation
})
