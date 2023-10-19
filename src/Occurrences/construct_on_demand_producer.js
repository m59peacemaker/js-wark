import { create_state } from './internal/create_state.js'
import { join_propagation } from './internal/join_propagation.js'
import { produce } from './internal/produce.js'

export const construct_on_demand_producer = producer_f => {
	const state = create_state()
	let deactivate

	const _produce = value => produce(self, state, value)

	const self = {
		compute: Symbol(),
		join_propagation: f => {
			const activate = state.propagation.size === 0
			const leave_propagation = join_propagation(f, state)
			if (activate) {
				deactivate = producer_f (_produce)
			}
			return () => {
				leave_propagation()
				if (state.propagation.size === 0) {
					deactivate()
				}
			}
		}
	}

	return self
}
