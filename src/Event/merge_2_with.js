import { get_computation, get_value, is_occurring } from '../Occurrences/internal/computation.js'
import { never } from './never.js'
import { nothing } from './nothing.js'
import { no_op } from '../util/no_op.js'

/*
	TODO:
		merge_2_with is the most generic way to merge occurrences,
		but it's also therefore the least efficient.
		Most things derived from this would have better performance by implementing them directly
		with similar low level code.
*/

const a_merge_2_with = (f, x, _) => ({
	occurrences: {
		compute: instant => {
			const computation = get_computation(x.occurrences.compute, instant)
			const value = is_occurring(computation)
				?
					f
						(get_value(computation))
						(nothing)
					:
						nothing
			return value === nothing ? false : () => value
		},
		join_propagation: x.occurrences.join_propagation
	},
	is_complete: x.is_complete
})

const b_merge_2_with = (f, _, x) => ({
	occurrences: {
		compute: instant => {
			const computation = get_computation(x.occurrences.compute, instant)
			const value = is_occurring(computation)
				?
					f
						(get_value(computation))
						(nothing)
					:
						nothing
			return value === nothing ? false : () => value
		},
		join_propagation: x.occurrences.join_propagation
	},
	is_complete: x.is_complete
})

const a_b_merge_2_with = (f, a, b) => {
	const dependants = new Map()
	const completion_dependants = new Map()
	let leave_a_propagation = no_op
	let leave_b_propagation = no_op
	let leave_a_completion_propagation = no_op
	let leave_b_completion_propagation = no_op

	const join_completion_propagation = () => {
		leave_a_completion_propagation = a.is_complete.updates.join_propagation(instant => {
			for (const f of completion_dependants.values()) {
				f(instant)
			}
			// instant.computations.push(instant => {
				if (is_occurring(get_computation(a.is_complete.updates.compute, instant))) {
					instant.post_computations.push(() => {
						leave_a_propagation()
						leave_a_completion_propagation()
					})
				}
			// })
		})
		leave_b_completion_propagation = b.is_complete.updates.join_propagation(instant => {
			for (const f of completion_dependants.values()) {
				f(instant)
			}
			// instant.computations.push(instant => {
				if (is_occurring(get_computation(b.is_complete.updates.compute, instant))) {
					instant.post_computations.push(() => {
						leave_b_propagation()
						leave_b_completion_propagation()
					})
				}
			// })
		})
	}

	const join_propagation = () => {
		if (a.is_complete.perform() === false) {
			leave_a_propagation = a.occurrences.join_propagation(instant => {
				for (const f of dependants.values()) {
					f(instant)
				}
			})
		}

		if (b.is_complete.perform() === false) {
			leave_b_propagation = b.occurrences.join_propagation(instant => {
				for (const f of dependants.values()) {
					f(instant)
				}
			})
		}
	}

	return {
		is_complete: {
			updates: {
				compute: instant => {
					const a_computation = get_computation(a.is_complete.updates.compute, instant)
					const b_computation = get_computation(b.is_complete.updates.compute, instant)
					const a_is_complete = a.is_complete.perform() || is_occurring(a_computation)
					const b_is_complete = b.is_complete.perform() || is_occurring(b_computation)
					const is_complete = a_is_complete && b_is_complete
					return is_complete
						?
							() => true
						: false
				},
				join_propagation: f => {
					const id = Symbol()
					completion_dependants.set(id, f)
					if (completion_dependants.size + dependants.size === 1) {
						join_completion_propagation()
					}
					return () => {
						completion_dependants.delete(id)
						if (completion_dependants.size + dependants.size === 0) {
							leave_a_completion_propagation()
							leave_b_completion_propagation()
						}
					}
				}
			},
			perform: () => a.is_complete.perform() && b.is_complete.perform()
		},
		occurrences: {
			compute: instant => {
				if (a.is_complete.perform()) {
					const b_computation = get_computation(b.occurrences.compute, instant)
					const value = is_occurring(b_computation)
						?
							f
								(nothing)
								(get_value(b_computation))
							:
								nothing
					return value === nothing ? false : () => value
				} else if (b.is_complete.perform()) {
					const a_computation = get_computation(a.occurrences.compute, instant)
					const value = is_occurring(a_computation)
						?
							f
								(nothing)
								(get_value(a_computation))
							:
								nothing
					return value === nothing ? false : () => value
				} else {
					const a_computation = get_computation(a.occurrences.compute, instant)
					const b_computation = get_computation(b.occurrences.compute, instant)
					const a_is_occurring = is_occurring(a_computation)
					const b_is_occurring = is_occurring(b_computation)
					const value = a_is_occurring || b_is_occurring
						?
							f
								(a_is_occurring ? get_value(a_computation) : nothing)
								(b_is_occurring ? get_value(b_computation) : nothing)
						:
							nothing
					return value === nothing ? false : () => value
				}
			},
			join_propagation: f => {
				const id = Symbol()
				dependants.set(id, f)
				if (dependants.size === 1) {
					join_propagation()
					if (completion_dependants.size === 0) {
						join_completion_propagation()
					}
				}
				return () => {
					dependants.delete(id)
					if (dependants.size === 0) {
						leave_a_propagation()
						leave_b_propagation()
						leave_a_propagation = no_op
						leave_b_propagation = no_op
						if (completion_dependants.size === 0) {
							leave_a_completion_propagation()
							leave_b_completion_propagation()
						}
					}
				}
			}
		}
	}
}

export const merge_2_with = f => a => b => {
	if (a.is_complete.perform() && b.is_complete.perform()) {
		return never
	} else if (a.is_complete.perform()) {
		return b_merge_2_with(f, a, b)
	} else if (b.is_complete.perform()) {
		return a_merge_2_with(f, a, b)
	} else {
		return a_b_merge_2_with(f, a, b)
	}
}
