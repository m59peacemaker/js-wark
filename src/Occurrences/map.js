import { get_computation, get_value, is_occurring } from './internal/computation.js'

export const map = f => x => ({
	compute: instant => {
		const x_computation = get_computation(x.compute, instant)
		return is_occurring(x_computation)
			?
				() => f(get_value(x_computation))
			:
				false
	},
	join_propagation: x.join_propagation
})
