import { create_state } from '../Occurrences/internal/create_state.js'
import { join_propagation } from '../Occurrences/internal/join_propagation.js'
import { produce } from '../Occurrences/internal/produce.js'
import { of } from '../Variable/of.js'
import { register_finalizer } from '../finalization.js'

export const construct_weak_producer = producer_f => {
	const state = create_state()

	const self = {
		occurrences: {
			compute: Symbol(),
			join_propagation: f => join_propagation(f, state),
		},
		is_complete: of (false)
	}

	const self_ref = new WeakRef(self)

	register_finalizer(
		self,
		producer_f(value => {
			const self = self_ref.deref()
			if (self !== undefined) {
				produce(self.occurrences, state, value)
			}
		})
	)

	return self
}
