import { _nothing } from './internal/_nothing.js'

export const tag = y => x => {
	const dependants = new Map()

	const self = {
		instant: x.instant,
		compute: y.perform,
		observe: x.observe,
		join_propagation: f => {
			const id = Symbol()
			dependants.set(id, f)
			return () => dependants.delete(id)
		}
	}

	const leave_propagation = x.join_propagation(
		instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, { computed: false, value: _nothing })
				for (const f of dependants.values()) {
					f(instant)
				}
			}
		}
	)

	const instant = x.instant()
	if (instant !== null) {
		instant.cache.set(self, { computed: false, value: _nothing })
	}

	return self
}
