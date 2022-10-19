import { _nothing } from './internal/_nothing.js'

export const tag = y => x => {
	const self = {
		instant: x.instant,
		compute: y.perform,
		observe: x.observe,
		propagate: instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, { computed: false, value: _nothing })
				for (const dependant of self.dependants) {
					dependant.propagate(instant)
				}
			}
		},
		dependants: new Set(),
	}

	x.dependants.add(self)

	const instant = x.instant()
	if (instant !== null) {
		instant.cache.set(self, { computed: false, value: _nothing })
	}

	return self
}
