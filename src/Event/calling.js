import { get_value } from './internal/get_value.js'
import { get_value_with_cache } from './internal/get_value_with_cache.js'
import { _nothing } from './internal/_nothing.js'

export const calling = f => x => {
	const self = {
		instant: x.instant,
		compute: instant => {
			const x_value = get_value (instant, x)
			return x_value === _nothing ? _nothing : f(x_value)
		},
		observe: x.observe,
		propagate: instant => {
			if (!instant.cache.has(self)) {
				const cache = { computed: false, value: _nothing }
				instant.cache.set(self, cache)
				for (const d of self.dependants) {
					d.propagate(instant)
				}
				// Ensure this is computed, regardless of dependants.
				instant.computations.push(instant => get_value_with_cache(instant, cache, self))
			}
		},
		dependants: new Set()
	}

	x.observe()
	x.dependants.add(self)

	const instant = x.instant()
	if (instant !== null) {
		const cache = { computed: false, value: _nothing }
		instant.cache.set(self, cache)
		instant.computations.push(instant => get_value_with_cache(instant, cache, self))
	}

	return self
}
