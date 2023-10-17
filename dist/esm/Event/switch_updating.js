import { _nothing } from './internal/_nothing.js';
import { register_finalizer } from '../finalization.js';
import { get_value } from './internal/get_value.js';
import { get_value_with_cache } from './internal/get_value_with_cache.js';

// import { Error_Cycle_Detected } from './Error_Cycle_Detected.js'

const switch_updating = resolve => initial_focused_event => source_event => {
	let focused_event = initial_focused_event;

	const self = {
		instant: () => initial_focused_event.instant() || source_event.instant(),
		compute: instant => {
			const focusing_event = get_value(instant, source_event);
			if (focusing_event === _nothing) {
				return get_value (instant, focused_event)
			} else {
				instant.post_computations.push(() => {
					focused_event.dependants.delete(self);
					focusing_event.dependants.add(self);
					focused_event = focusing_event;
				});
				const resolve_event = resolve (focused_event) (focusing_event);
				return get_value (instant, resolve_event)
			}
		},
		propagate: instant => {
			if (!instant.cache.has(self)) {
				const cache = { computed: false, value: _nothing };
				instant.cache.set(self, cache);
				for (const dependants of self.dependants) {
					dependants.propagate(instant);
				}
				// Ensure this computes, regardless of dependants.
				instant.computations.push(instant => get_value_with_cache(instant, cache, self));
			}
		},
		dependants: new Set()
	};

	source_event.dependants.add(self);
	focused_event.dependants.add(self);

	register_finalizer(self, () => {
		source_event.dependants.delete(self);
		focused_event.dependants.delete(self);
	});

	const instant = self.instant();
	if (instant !== null) {
		// TODO: rename cache to state
		const cache = { computed: false, value: _nothing };
		instant.cache.set(self, cache);
		instant.computations.push(instant => get_value_with_cache(instant, cache, self));
	}

	return self
};

export { switch_updating };
