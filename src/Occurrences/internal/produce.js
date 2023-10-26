import { create as create_instant } from '../../Instant/create.js'

export const produce = (self, state, value) => {
	const instant = create_instant()
	state.instant = instant
	instant.cache.set(self.compute, { compute_value: () => value, value })
	for (const f of state.propagation) {
		f(instant)
	}
	state.instant = null
	for (const f of instant.post_computations) {
		f()
	}
}
