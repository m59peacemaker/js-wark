import { register_finalizer } from '../lib/finalization.js';
import { get_computation, is_occurring, get_value } from '../Occurrences/internal/computation.js';
import { of } from '../Dynamic/of.js';

const hold = initial_value => updates => {
	if (updates.completed.perform()) {
		return of (initial_value)
	}

	let value = initial_value;

	const leave_propagation = updates.occurrences.join_propagation(instant => {
		const updates_computation = get_computation(updates.occurrences.compute, instant);
		if (is_occurring(updates_computation)) {
			const updated_value = get_value(updates_computation);
			instant.post_computations.push(() => {
				value = updated_value;
			});
		}
	});

	const leave_completion_propagation = updates.completed.updates.join_propagation(instant => {
		if (is_occurring(get_computation(updates.completed.updates.compute, instant))) {
			instant.post_computations.push(() => {
				leave_propagation();
				leave_completion_propagation();
				unregister_finalizer();
			});
		}
	});

	const unregister_finalizer = register_finalizer(updates, () => {
		leave_propagation();
		leave_completion_propagation();
	});

	return {
		updates,
		perform: () => value
	}
};

export { hold };
