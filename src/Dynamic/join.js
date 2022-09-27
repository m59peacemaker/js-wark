import { switch as switching } from '../Event/switch.js'
import { map } from '../Event/map.js'
import { merge_2_with } from '../Event/merge_2_with.js'
import { tag } from '../Event/tag.js'
import { nothing as public_nothing } from '../Event/nothing.js'
import { nothing } from '../Event/internal/nothing.js'
import { switch_with } from '../Event/switch_with.js'
import { switch_resolver_eager } from '../Event/switch_resolver_eager.js'
// import { forward_reference as Event_forward_reference } from '../Event/forward_reference.js'

const registry = new FinalizationRegistry(unobserve => unobserve())
const uninitialized = Symbol()

export const join = dynamic => {
	let value = uninitialized

	// const updates_reference = Event_forward_reference()

	const updates = merge_2_with
		(a => b => b === public_nothing ? a : b.run())
		(switch_with (switch_resolver_eager) (initial_inner_dynamic.updates) (inner_dynamics))
		(inner_dynamics)

	// let value = f (dynamic.run()).run()

	// const mapped = map (f) (dynamic.updates)

	const self = {
		compute: (time, f) => {
			dynamic.compute(inner_dynamic => {
				inner_dynamic.compute(time, x => f(value = x))
			})
		},
		run: () => {
			value
		},
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
