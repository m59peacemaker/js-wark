import { register_finalizer } from '../lib/finalization.js';
import { get_computation, is_occurring, get_value } from '../Occurrences/internal/computation.js';
import { of } from '../Dynamic/of.js';

const scan = reducer => initial_value => event => {
	if (event.completed.perform()) {
		return of (initial_value)
	}

	let value = initial_value;

	const updates = {
		occurrences: {
			compute: instant => {
				const computation = get_computation(event.occurrences.compute, instant);
				return is_occurring(computation)
					?
						() => reducer (get_value(computation)) (value)
					:
						false
			},
			join_propagation: event.occurrences.join_propagation
		},
		completed: event.completed
	};

	/*
		TODO:
			all the code below should be shareable with Event.hold by passing in `updates`.
			The only difference between them should be that `hold` uses the `updates` event passed into it, while `scan` has to derive its `updates` from the input event.
			Maybe `scan` should even be implemented from `hold`:
			```
			const updates = {
				// ...as above
					() => reducer (get_value(computation)) (self.perform())
			}
			const self = hold (initial_value) (updates)
			return self
	*/
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

export { scan };
