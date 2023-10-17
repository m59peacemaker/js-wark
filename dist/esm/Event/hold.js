import { get_value } from './internal/get_value.js';
import { _nothing } from './internal/_nothing.js';
import { register_finalizer } from '../finalization.js';

const hold = initial_value => updates => {
	let value = initial_value;

	const receive_update = instant => {
		instant.post_computations.push(instant => {
			const update_value = get_value(instant, updates);
			if (update_value !== _nothing) {
				value = update_value;
			}
		});
	};

	const self = {
		updates,
		perform: () => value,
		propagate: receive_update
	};

	updates.dependants.add(self);

	register_finalizer(self, () => updates.dependants.delete(self));

	const instant = updates.instant();
	if (instant !== null) {
		receive_update(instant);
	}

	return self
};

export { hold };
