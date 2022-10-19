import { _nothing } from './internal/_nothing.js'
import { create as create_instant } from '../Instant/create.js'
import { produce } from './internal/produce.js'

export const construct_on_demand_producer = f => {
	let instant = null
	let observers = 0
	let deactivate

	const self_produce = x => {
		const self = self_ref.deref()
		instant = create_instant()
		produce(self, instant, x)
		instant = null
	}

	const self = {
		instant: () => instant,
		dependants: new Set(),
		observe: () => {
			++observers
			if (observers === 1) {
				deactivate = f (self_produce)
			}
			return () => {
				--observers
				if (observers === 0) {
					deactivate()
				}
			}
		}
	}

	return self
}
