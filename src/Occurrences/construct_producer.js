import { create_state } from './internal/create_state.js'
import { join_propagation } from './internal/join_propagation.js'
import { produce } from './internal/produce.js'

export const construct_producer = f => {
	const state = create_state()

	/*
		TODO:
			Setting producer.compute to a symbol is ugly,
			but it works and was the best I could do for efficiency so far.
			It's to use `compute` as a cache key so
			
	*/
	const self = {
		compute: Symbol(),
		join_propagation: f => join_propagation(f, state)
	}

	f(value => produce(self, state, value))

	return self
}
