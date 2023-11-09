import { join_propagation } from './internal/join_propagation.js'
import { produce } from './internal/produce.js'

export const construct_producer = f => {
	const propagation = new Set()

	/*
		TODO:
			Setting producer.compute to a symbol is ugly,
			but it works and was the best I could do for efficiency so far.
	*/
	const self = {
		compute: {},
		join_propagation: f => join_propagation(f, propagation)
	}

	f(value => produce(self, propagation, value))

	return self
}
