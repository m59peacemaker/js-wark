import { create as create_instant } from '../../Instant/create.js'

export const produce = (self, propagation, value) => {
	const instant = create_instant()
	instant.cache.set(self.compute, { compute_value: () => value, value })
	for (const f of propagation) {
		f(instant)
	}
	for (const f of instant.post_computations) {
		f()
	}
}
