import { map } from './map.js';
import { _use } from '../Reference/use.js';

const _is_complete = event => {
	const updates = map
		(() => true)
		(event.complete);

	let value = event.complete.occurred !== null;

	const self = {
		run: () => value,
		updates
	};

	if (!value) {
		const unobserve = event.complete.observe({
			pre_compute: () => {},
			compute: () => {
				if (event.complete.value !== nothing) {
					event.complete.computed.post_propagation.add(() => {
						value = true;
					});
				}
			}
		});

		registry.register(self, unobserve);
	}

	return self
};

// TODO: resolve event.complete here as well?
const is_complete = event =>
	_use(event, _is_complete);

export { _is_complete, is_complete };
