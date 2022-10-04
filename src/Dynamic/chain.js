import { join } from './join.js'
import { map } from './map.js'

export const chain = f => x => join (map (f) (x))
/*
Event.switch_updating
resolve => initial => source
f       => Event   => Event Event

Dynamic.switching
source =>
Dynamic Event => Event
Dynamic.switching = Event.switch_updating (immediately) (source.run()) (source)

Event.switching
source =>
Event Event => Event
Event.switching = Event.switch_updating (immediately) (never) (source)
*/

// import { map } from '../Event/map.js'
// import { merge_2_with } from '../Event/merge_2_with.js'
// import { nothing as public_nothing } from '../Event/nothing.js'
// import { nothing } from '../Event/internal/nothing.js'
// import { switch_updating } from '../Event/switch_updating.js'
// import { _use } from '../Reference/use.js'
// import { immediately } from '../immediately.js'

// const registry = new FinalizationRegistry(unobserve => unobserve())

// // TODO: use underscore version of functions e.g. _map
// export const _chain = (f, dynamic) => {
// 	const initial_inner_dynamic = f (dynamic.run())
// 	let value = initial_inner_dynamic.run()

// 	const inner_dynamics = map (f) (dynamic.updates)

// 	const updates = merge_2_with
// 		(a => b => b === public_nothing ? a : b.run())
// 		(switch_updating
// 			(immediately)
// 			(initial_inner_dynamic.updates)
// 			(map
// 				(x => x.updates)
// 				(inner_dynamics)
// 			)
// 		)
// 		(inner_dynamics)

// 	const self = {
// 		run: () => value,
// 		updates,
// 	}

// 	const unobserve = updates.observe({
// 		pre_compute: () => {},
// 		compute: () => {
// 			if (updates.value !== nothing) {
// 				value = updates.value
// 			}
// 		}
// 	})
	
// 	registry.register(self, unobserve)

// 	return self
// }

// export const chain = f => dynamic =>
// 	_use(dynamic, dynamic => _chain (f, dynamic))
