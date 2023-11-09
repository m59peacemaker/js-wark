import { map as map$1 } from '../Occurrences/map.js';
import { get_computation, is_occurring } from '../Occurrences/internal/computation.js';
import { undetermined } from './internal/undetermined.js';
import { register_finalizer } from '../lib/finalization.js';
import { never } from '../Event/never.js';

const map = f => x => {
	let value = undetermined;
	
	const perform = () => {
		if (value === undetermined) {
			value = f(x.perform());
		}
		return value
	};

	if (x.updates.completed.perform()) {
		return {
			updates: never,
			perform
		}
	}

	const updates_occurrences = map$1 (f) (x.updates.occurrences);

	const leave_propagation = updates_occurrences.join_propagation(instant => {
		const computation = get_computation(updates_occurrences.compute, instant);
		/*
			Check `is_occurring` during regular computation phase,
			so as not to race with with state changes in the post computation phase.
		*/
		if (is_occurring(computation)) {
			instant.post_computations.push(() => {
				/*
					Check whether a value was cached during the post computation phase,
					so as not to race with it being computed and cached during the computation phase.
				*/
				if ('value' in computation) {
					value = computation.value;
				} else {
					value = undetermined;
				}
			});
		}
	});

	const leave_completion_propagation = x.updates.completed.updates.join_propagation(instant => {
		if (is_occurring(x.updates.completed.updates.compute)) {
			instant.post_computations.push(() => {
				leave_propagation();
				leave_completion_propagation();
				unregister_finalizer();
			});
		}
	});

	const updates = {
		occurrences: updates_occurrences,
		completed: x.updates.completed
	};

	const unregister_finalizer = register_finalizer(updates, () => {
		leave_propagation();
		leave_completion_propagation();
	});

	return {
		perform,
		updates
	}
};

export { map };
