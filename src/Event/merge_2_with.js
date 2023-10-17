import { get_computation, get_value, is_occurring } from './internal/computation.js'
import { nothing } from './nothing.js'

/*
	TODO:
		merge_2_with is the most generic way to merge occurrences,
		but it's also therefore the least efficient.
		Most things derived from this would have better performance by implementing them directly
		with similar low level code.
*/
export const merge_2_with = f => a => b => ({
	compute: instant => {
		const a_computation = get_computation(a, instant)
		const b_computation = get_computation(b, instant)
		const a_is_occurring = is_occurring(a_computation)
		const b_is_occurring = is_occurring(b_computation)
		const value = a_is_occurring || b_is_occurring
			?
				f
					(a_is_occurring ? get_value(a_computation) : nothing)
					(b_is_occurring ? get_value(b_computation) : nothing)
				:
					nothing
		return value === nothing
			?
				false
			:
				() => value
	},
	join_propagation: f => {
		const leave_a_propagation = a.join_propagation(f)
		const leave_b_propagation = b.join_propagation(f)
		return () => {
			leave_a_propagation()
			leave_b_propagation()
		}
	}
})
