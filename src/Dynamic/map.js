// import { chain } from './chain.js'
// import { of } from './of.js'

// export const map = f => dynamic => chain (x => of (f(x))) (dynamic)

import { _use } from '../Reference/use.js'
import { _map as Event_map } from '../Event/map.js'
import { map as Sample_map } from '../Sample/map.js'
// import { nothing } from '../Event/internal/nothing.js'

// const registry = new FinalizationRegistry(unobserve => unobserve())
// export const _map = (f, dynamic) => {
// 	let value = f (dynamic.run())
	
// 	const updates = Event_map(f, dynamic.updates)

// 	const self = {
// 		run: () => value,
// 		updates
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

export const _map = (f, dynamic) => {
	const self = Sample_map (f) (dynamic)
	self.updates = Event_map(f, dynamic.updates)
	return self
}

export const map = f => dynamic =>
	_use(dynamic, dynamic => _map (f, dynamic))
