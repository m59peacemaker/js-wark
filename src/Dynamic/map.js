import { chain } from './chain.js'
import { of } from './of.js'

export const map = f => dynamic => chain (x => of (f(x))) (dynamic)

// const registry = new FinalizationRegistry(unobserve => unobserve())
// export const map = f => dynamic => {
// 	let init = false
// 	let value
	
// 	const self = {
// 		run: () => {
// 			if (!init) {
// 				init = true
// 				value = f (dynamic.run())
// 			}
// 			return value
// 		},
// 		updates: Event_map (f) (dynamic.updates)
// 	}

// 	const unobserve = self.updates.observe(({
// 		pre_compute: () => {},
// 		compute: () => {
// 			if (event.value !== nothing) {
// 				value = event.value
// 			}
// 		}
// 	})
	
// 	registry.register(self, unobserve)

// 	return self
// }
