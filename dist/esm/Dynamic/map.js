import { _use } from '../Reference/use.js';
import { _map as _map$1 } from '../Event/map.js';
import { map as map$1 } from '../Sample/map.js';

// import { chain } from './chain.js'
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

const _map = (f, dynamic) => {
	const self = map$1 (f) (dynamic);
	self.updates = _map$1(f, dynamic.updates);
	return self
};

const map = f => dynamic =>
	_use(dynamic, dynamic => _map (f, dynamic));

export { _map, map };
