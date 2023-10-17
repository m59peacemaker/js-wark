import { create_state } from './internal/create_state.js'
import { join_propagation } from './internal/join_propagation.js'
import { produce } from './internal/produce.js'
// import { compute_nothing } from './internal/compute_nothing.js'
// import { compute_cached_value } from './internal/compute_cached_value.js'
import { get_value } from './internal/get_value.js'
import { never_occurs } from './internal/never_occurs.js'

export const construct_producer = f => {
	const state = create_state()

	const self = {
		occurrences: {
			compute: instant => instant.cache.get(self).value,
			join_propagation: f => join_propagation(f, state)
		},
		completion: never_occurs,
		is_complete: false
	}

	f(value => produce(self, state, value))

	return self
}
