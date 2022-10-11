import { map } from '../Event/map.js';
import { merge_2_with } from '../Event/merge_2_with.js';
import { nothing as nothing$1 } from '../Event/nothing.js';
import { nothing } from '../Event/internal/nothing.js';
import { switch_updating } from '../Event/switch_updating.js';
import { _use } from '../Reference/use.js';
import { immediately } from '../immediately.js';
import { updates } from './updates.js';
import { get } from './get.js';

const registry = new FinalizationRegistry(unobserve => unobserve());

const _join = (dynamic, initial_inner_dynamic) => {
	let value = initial_inner_dynamic.run();

	/*
		TODO: merging adds a lot of work just to get the joined update event to occur at the time the input dynamic update event occurs
		and the switch implementation is probably already doing the same heavy lifting, almost as though the occurrence we need is right there,
		and it just doesn't consider it.
		A lower level function could be made from which this `updates` event for `join` could be derived, and Event's switch could also be derived.
		It would be especially wild if that function could also derive merging (at least for fun).
		But keep in mind it would be ideal to generate implementation code at build time for maximum efficiency and byte vs performance options.
		`switch_updating` may already be this function, except it's not clear how to present the resolve function so all this can be expressed.
		const get_event_value = event => event.value
		const event_is_occurring = event => get_value (event) !== public_nothing
		Example:
			switch_updating
				(x => y =>
					event_is_occurring (updates (dynamic))
						? calling (get_dynamic_value) (updates (dynamic))
						: y
				)
	*/
	// TODO: this should be able to use _merge_2_with, _switch_updating, and _map for efficiency.
	const updates$1 = merge_2_with
		(a => b => b === nothing$1 ? a : get(b))
		(switch_updating
			(immediately)
			(initial_inner_dynamic.updates)
			(map
				(updates)
				(dynamic.updates)
			)
		)
		(dynamic.updates);

	// TODO: this use Sample.join instead, and not observe its own updates. This should currently be bugged by updating to the new value in the same instant the update event occurs (this is the old behavior)
	const self = {
		run: () => value,
		updates: updates$1,
	};

	const unobserve = updates$1.observe({
		pre_compute: () => {},
		compute: () => {
			if (updates$1.value !== nothing) {
				value = updates$1.value;
			}
		}
	});
	
	registry.register(self, unobserve);

	return self
};

const join = dynamic =>
	_use(dynamic, dynamic => {
		return _use(dynamic.run(), initial_inner_dynamic =>
			_join(dynamic, initial_inner_dynamic)
		)
	});

export { _join, join };
