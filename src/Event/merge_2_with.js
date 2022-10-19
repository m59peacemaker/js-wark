import { get_value } from './internal/get_value.js'
import { _nothing } from './internal/_nothing.js'
import { nothing } from './nothing.js'

export const merge_2_with = f => a => b => {
	const dependants = new Map()

	const propagate = instant => {
		if (!instant.cache.has(self)) {
			instant.cache.set(self, { computed: false, value: _nothing })
			for (const f of dependants.values()) {
				f(instant)
			}
		}
	}

	const self = {
		instant: () => a.instant() || b.instant(),
		compute: instant => {
			const a_value = get_value (instant, a)
			const b_value = get_value (instant, b)
			const value = a_value === _nothing && b_value === _nothing
				? _nothing
				:
					f
						(a_value === _nothing ? nothing : a_value)
						(b_value === _nothing ? nothing : b_value)
			return value === nothing ? _nothing : value
		},
		observe: () => {
			const stop_observing_a = a.observe()
			const stop_observing_b = b.observe()
			return () => {
				stop_observing_a()
				stop_observing_b()
			}
		},
		join_propagation: f => {
			const id = Symbol()
			dependants.set(id, f)
			return () => dependants.delete(id)
		}
	}

	const leave_a_propagation = a.join_propagation(propagate)
	const leave_b_propagation = b.join_propagation(propagate)

	const instant = self.instant()
	if (instant !== null) {
		instant.cache.set(self, { computed: false, value: _nothing })
	}

	return self
}
