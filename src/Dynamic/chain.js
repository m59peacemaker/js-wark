import { map } from '../Event/map.js'
import { merge_2_with } from '../Event/merge_2_with.js'
import { nothing as public_nothing } from '../Event/nothing.js'
import { nothing } from '../Event/internal/nothing.js'
import { switch_with } from '../Event/switch_with.js'
import { switch_resolver_eager } from '../Event/switch_resolver_eager.js'
import { _use } from '../reference.js'

const registry = new FinalizationRegistry(unobserve => unobserve())

/*
	TODO: clean this up after refactoring Event.switch*
*/
export const _chain = (f, dynamic) => {
	const initial_inner_dynamic = f (dynamic.run())
	let value = initial_inner_dynamic.run()

	const inner_dynamics = map (f) (dynamic.updates)

	const updates = merge_2_with
		(a => b => b === public_nothing ? a : b.run())
		(switch_with (switch_resolver_eager) (x => x.updates) (initial_inner_dynamic.updates) (inner_dynamics))
		(inner_dynamics)

	// let value = f (dynamic.run()).run()

	// const mapped = map (f) (dynamic.updates)

	const self = {
		run: () => value,
		updates,
		// updates: merge_2_with
		// 	(a => b => b === public_nothing ? a : b.run())
		// 	(switching (x => x.updates) (mapped))
		// 	(mapped)
	}

	const unobserve = self.updates.observe({
		pre_compute: () => {},
		compute: () => {
			if (self.updates.value !== nothing) {
				value = self.updates.value
			}
		}
	})
	
	registry.register(self, unobserve)

	return self
}

export const chain = f => dynamic =>
	_use(dynamic, dynamic => _chain (f, dynamic))
