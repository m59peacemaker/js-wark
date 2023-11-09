import { join_propagation } from './internal/join_propagation.js'
import { produce } from './internal/produce.js'

export const construct_on_demand_producer = producer_f => {
	const propagation = new Set()
	let deactivate

	const _produce = value => produce(self, propagation, value)

	const self = {
		compute: {},
		join_propagation: f => {
			const activate = propagation.size === 0
			const leave_propagation = join_propagation(f, propagation)
			if (activate) {
				deactivate = producer_f (_produce)
			}
			return () => {
				leave_propagation()
				if (propagation.size === 0) {
					deactivate()
				}
			}
		}
	}

	return self
}
