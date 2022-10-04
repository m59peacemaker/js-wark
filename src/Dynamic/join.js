import { map } from '../Event/map.js'
import { merge_2_with } from '../Event/merge_2_with.js'
import { nothing as public_nothing } from '../Event/nothing.js'
import { nothing } from '../Event/internal/nothing.js'
import { switch_updating } from '../Event/switch_updating.js'
import { _call } from '../Reference/call.js'
import { _use } from '../Reference/use.js'
import { immediately } from '../immediately.js'
import { updates as Dynamic_updates } from './updates.js'
import { get } from './get.js'

const registry = new FinalizationRegistry(unobserve => unobserve())

export const _join = (dynamic, initial_inner_dynamic) => {
	let value = initial_inner_dynamic.run()

	// TODO: this should be able to use _merge_2_with, _switch_updating, and _map for efficiency.
	/*
		TODO: merging adds a lot of work just to get the joined update event to occur at the time the input dynamic update event occurs
		and the switch implementation is probably already doing the same heavy lifting, almost as though the occurrence we need is right there,
		and it just doesn't consider it.
		A lower level function could be made from which this `updates` event for `join` could be derived, and Event's switch could also be derived.
		It would be especially wild if that function could also derive merging (at least for fun).
		But keep in mind it would be ideal to generate implementation code at build time for maximum efficiency and byte vs performance options.
	*/
	const updates = merge_2_with
		(a => b => b === public_nothing ? a : get(b))
		(switch_updating
			(immediately)
			(initial_inner_dynamic.updates)
			(map
				(Dynamic_updates)
				(dynamic.updates)
			)
		)
		(dynamic.updates)

	const self = {
		run: () => value,
		updates,
	}

	const unobserve = updates.observe({
		pre_compute: () => {},
		compute: () => {
			if (updates.value !== nothing) {
				value = updates.value
			}
		}
	})
	
	registry.register(self, unobserve)

	return self
}

export const join = dynamic =>
	_use(dynamic, dynamic => {
		return _use(dynamic.run(), initial_inner_dynamic =>
			_join(dynamic, initial_inner_dynamic)
		)
	})
