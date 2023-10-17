import { create as create_instant } from '../../Instant/create.js'
import { run as run_instant } from '../../Instant/run.js'

export const produce = (self, state, value) => {
	const instant = create_instant()
	state.instant = instant
	instant.cache.set(self.compute, { compute_value: () => value, value })
	for (const f of state.propagation) {
		f(instant)
	}
	run_instant(instant)
	state.instant = null
}
