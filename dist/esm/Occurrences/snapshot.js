import { get_computation, is_occurring, get_value } from './internal/computation.js';

const snapshot = f => sample => x => ({
	compute: instant => {
		const x_computation = get_computation(x.compute, instant);
		return is_occurring(x_computation)
			?
				() => f (sample.perform(instant)) (get_value(x_computation))
			:
				false
	},
	join_propagation: x.join_propagation
});

export { snapshot };