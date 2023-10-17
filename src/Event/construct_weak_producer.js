import { create_state } from './internal/create_state.js'
import { compute_nothing } from './internal/compute_nothing.js'
import { join_propagation } from './internal/join_propagation.js'
import { produce } from './internal/produce.js'
import { register_finalizer } from '../finalization.js'
import { never_occurs } from './internal/never_occurs.js'

export const construct_weak_producer = f => {
	const state = create_state()

	const self = {
		occurrences: {
			compute: instant => instant.cache.get(self.occurrences).value,
			join_propagation: f => join_propagation(f, state),
		},
		completion: never_occurs,
		is_complete: false
	}

	const self_ref = new WeakRef(self)

	register_finalizer(
		self,
		f(value => {
			const self = self_ref.deref()
			if (self !== undefined) {
				produce(self, state, value)
			}
		})
	)

	return self
}
