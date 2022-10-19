import { _nothing } from './internal/_nothing.js'
import { create as create_instant } from '../Instant/create.js'
import { produce } from './internal/produce.js'

export const construct_on_demand_producer = f => {
	const dependants = new Map()
	let instant = null
	let observers = 0
	let deactivate

	const self_produce = x => {
		const self = self_ref.deref()
		instant = create_instant()
		produce(instant, dependants, self, x)
		instant = null
	}

	const self = {
		instant: () => instant,
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
		},
		join_propagation: f => {
			const id = Symbol()
			dependants.set(id, f)
			return () => dependants.delete(id)
		}
	}

	return self
}
