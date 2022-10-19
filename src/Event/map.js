import { get_value } from './internal/get_value.js'
import { _nothing } from './internal/_nothing.js'

export const map = f => x => {
	const dependants = new Map()

	const self = {
		instant: x.instant,
		compute: instant => {
			const x_value = get_value(instant, x)
			return x_value === _nothing ? _nothing : f(x_value)
		},
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


