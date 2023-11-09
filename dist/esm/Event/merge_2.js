import { get_computation, is_occurring, get_value } from '../Occurrences/internal/computation.js';
import { never } from './never.js';
import { nothing } from './nothing.js';
import { no_op } from '../util/no_op.js';

/*
	TODO:
		merge_2 is the most generic way to merge occurrences,
		but it's also therefore the least efficient.
		Most things derived from this would have better performance by implementing them directly
		with similar low level code.
*/

const a_merge_2 = (f, x, _) => ({
	occurrences: {
		compute: instant => {
			const computation = get_computation(x.occurrences.compute, instant);
			const value = is_occurring(computation)
				?
					f
						(get_value(computation))
						(nothing)
					:
						nothing;
			return value === nothing ? false : () => value
		},
		join_propagation: x.occurrences.join_propagation
	},
	completed: x.completed
});

const b_merge_2 = (f, _, x) => ({
	occurrences: {
		compute: instant => {
			const computation = get_computation(x.occurrences.compute, instant);
			const value = is_occurring(computation)
				?
					f
						(get_value(computation))
						(nothing)
					:
						nothing;
			return value === nothing ? false : () => value
		},
		join_propagation: x.occurrences.join_propagation
	},
	completed: x.completed
});

const a_b_merge_2 = (f, a, b) => {
	const dependants = new Map();
	const completion_dependants = new Map();
	let leave_a_propagation = no_op;
	let leave_b_propagation = no_op;
	let leave_a_completion_propagation = no_op;
	let leave_b_completion_propagation = no_op;

	const propagate = instant => {
		for (const f of dependants.values()) {
			f(instant);
		}
	};

	const propagate_completion = instant => {
		for (const f of completion_dependants.values()) {
			f(instant);
		}
	};

	const join_completion_propagation = () => {
		leave_a_completion_propagation = a.completed.updates.join_propagation(instant => {
			if (is_occurring(get_computation(a.completed.updates.compute, instant))) {
				get_computation(propagate_completion, instant);
				instant.post_computations.push(() => {
					leave_a_propagation();
					leave_a_completion_propagation();
				});
			}
		});
		leave_b_completion_propagation = b.completed.updates.join_propagation(instant => {
			if (is_occurring(get_computation(b.completed.updates.compute, instant))) {
				get_computation(propagate_completion, instant);
				instant.post_computations.push(() => {
					leave_b_propagation();
					leave_b_completion_propagation();
				});
			}
		});
	};

	const join_propagation = () => {
		if (a.completed.perform() === false) {
			leave_a_propagation = a.occurrences.join_propagation(instant => {
				get_computation(propagate, instant);
			});
		}

		if (b.completed.perform() === false) {
			leave_b_propagation = b.occurrences.join_propagation(instant => {
				get_computation(propagate, instant);
			});
		}
	};

	return {
		completed: {
			updates: {
				compute: instant => {
					const a_computation = get_computation(a.completed.updates.compute, instant);
					const b_computation = get_computation(b.completed.updates.compute, instant);
					const a_is_complete = a.completed.perform() || is_occurring(a_computation);
					const b_is_complete = b.completed.perform() || is_occurring(b_computation);
					const is_complete = a_is_complete && b_is_complete;
					return is_complete
						?
							() => true
						: false
				},
				join_propagation: f => {
					const id = Symbol();
					completion_dependants.set(id, f);
					if (completion_dependants.size + dependants.size === 1) {
						join_completion_propagation();
					}
					return () => {
						completion_dependants.delete(id);
						if (completion_dependants.size + dependants.size === 0) {
							leave_a_completion_propagation();
							leave_b_completion_propagation();
						}
					}
				}
			},
			perform: () => a.completed.perform() && b.completed.perform()
		},
		occurrences: {
			compute: instant => {
				if (a.completed.perform()) {
					const b_computation = get_computation(b.occurrences.compute, instant);
					const value = is_occurring(b_computation)
						?
							f
								(nothing)
								(get_value(b_computation))
							:
								nothing;
					return value === nothing ? false : () => value
				} else if (b.completed.perform()) {
					const a_computation = get_computation(a.occurrences.compute, instant);
					const value = is_occurring(a_computation)
						?
							f
								(nothing)
								(get_value(a_computation))
							:
								nothing;
					return value === nothing ? false : () => value
				} else {
					const a_computation = get_computation(a.occurrences.compute, instant);
					const b_computation = get_computation(b.occurrences.compute, instant);
					const a_is_occurring = is_occurring(a_computation);
					const b_is_occurring = is_occurring(b_computation);
					const value = a_is_occurring || b_is_occurring
						?
							f
								(a_is_occurring ? get_value(a_computation) : nothing)
								(b_is_occurring ? get_value(b_computation) : nothing)
						:
							nothing;
					return value === nothing ? false : () => value
				}
			},
			join_propagation: f => {
				const id = Symbol();
				dependants.set(id, f);
				if (dependants.size === 1) {
					join_propagation();
					if (completion_dependants.size === 0) {
						join_completion_propagation();
					}
				}
				return () => {
					dependants.delete(id);
					if (dependants.size === 0) {
						leave_a_propagation();
						leave_b_propagation();
						leave_a_propagation = no_op;
						leave_b_propagation = no_op;
						if (completion_dependants.size === 0) {
							leave_a_completion_propagation();
							leave_b_completion_propagation();
						}
					}
				}
			}
		}
	}
};

const merge_2 = f => a => b => {
	if (a.completed.perform() && b.completed.perform()) {
		return never
	} else if (a.completed.perform()) {
		return b_merge_2(f, a, b)
	} else if (b.completed.perform()) {
		return a_merge_2(f, a)
	} else {
		return a_b_merge_2(f, a, b)
	}
};

export { merge_2 };
