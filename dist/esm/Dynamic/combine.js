import { get_computation, is_occurring, get_value } from '../Occurrences/internal/computation.js';
import { undetermined } from './internal/undetermined.js';
import { register_finalizer } from '../lib/finalization.js';

const combine = f => dynamics => {
	let value = undetermined;
	let completed_value = undetermined;
	const dependants = new Map();
	const completion_dependants = new Map();

	const perform = () => {
		if (value === undetermined) {
			value = f(dynamics.map(dynamic => dynamic.perform()));
		}
		return value
	};

	const updates = {
		occurrences: {
			compute: instant => {
				let occurring = false;
				const value_getters = [];
				for (const dynamic of dynamics) {
					/*
						TODO:
							These conditions are awkward due to avoiding `get_computation` when an event is already complete.
							See if this can be improved.
					*/
					if (dynamic.updates.completed.perform()) {
						value_getters.push(dynamic.perform);
					} else {
						const computation = get_computation(dynamic.updates.occurrences.compute, instant);
						if (is_occurring(computation)) {
							occurring = true;
							value_getters.push(() => get_value(computation));
						} else {
							value_getters.push(dynamic.perform);
						}
					}
				}
				return occurring && (() => f(value_getters.map(f => f())))
			},
			join_propagation: f => {
				const id = Symbol();
				dependants.set(id, f);
				return () => dependants.delete(id)
			}
		},
		completed: {
			perform: () => {
				if (completed_value = undetermined) {
					completed_value = dynamics.every(dynamic => dynamic.updates.completed.perform());
				}
				return completed_value
			},
			updates: {
				compute: instant =>
					dynamics.every(dynamic =>
						dynamic.updates.completed.perform()
							|| is_occurring(get_computation(dynamic.updates.completed.updates.compute, instant))
					)
						?
							() => true
						:
							false
				,
				join_propagation: f => {
					const id = Symbol();
					completion_dependants.set(id, f);
					return () => completion_dependants.delete(id)
				}
			}
		}
	};

	const compute_propagation = instant => {
		for (const f of dependants.values()) {
			f(instant);
		}

		const computation = get_computation(updates.occurrences.compute, instant);
		if (is_occurring(computation)) {
			instant.post_computations.push(instant => {
				if ('value' in computation) {
					value = computation.value;
				} else {
					value = undetermined;
				}
			});
		}
	};

	const compute_completion_propagation = instant => {
		for (const f of completion_dependants.values()) {
			f(instant);
		}

		// TODO: this is probably not efficient for this case
		const computation = get_computation(updates.completed.updates.compute, instant);
		if (is_occurring(computation)) {
			instant.post_computations.push(instant => {
				if ('value' in computation) {
					completed_value = computation.value;
				} else {
					completed_value = undetermined;
				}
			});
		}
	};


	for (const dynamic of dynamics) {
		if (dynamic.updates.completed.perform() === false) {
			const leave_propagation = dynamic.updates.occurrences.join_propagation(instant => {
				get_computation(compute_propagation, instant);
			});

			const compute_completion = instant => {
				if (is_occurring(updates.completed.updates.compute)) {
					get_computation(compute_completion_propagation, instant);
					instant.post_computations.push(() => {
						leave_propagation();
						leave_completion_propagation();
						unregister_finalizer();
					});
				}
			};

			const leave_completion_propagation = dynamic.updates.completed.updates.join_propagation(instant =>
				/*
					TODO:
						this function is probably only called once per instant anyway,
						so there should be no need to interact with the cache (via get_computation)
						rather than running the code directly.
						This needs investigation.
				*/
				get_computation(compute_completion, instant)
			);

			const unregister_finalizer = register_finalizer(updates, () => {
				leave_propagation();
				leave_completion_propagation();
			});
		}
	}

	return {
		perform,
		updates
	}
};

export { combine };
