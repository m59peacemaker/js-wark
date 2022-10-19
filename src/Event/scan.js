import { get_value } from './internal/get_value.js'
import { get_value_with_cache } from './internal/get_value_with_cache.js'
import { _nothing } from './internal/_nothing.js'

import { register_finalizer } from '../finalization.js'

export const scan = reducer => initial_value => event => {
	const dependants = new Map()
	let value = initial_value

	const updates = {
		instant: event.instant,
		compute: instant => {
			const event_value = get_value (instant, event)
			if (event_value === _nothing) {
				return _nothing
			}
			const update_value = reducer (value) (event_value)
			instant.post_computations.push(() => value = update_value)
			return update_value
		},
		observe: event.observe,
		join_propagation: f => {
			const id = Symbol()
			dependants.set(id, f)
			return () => dependants.delete(id)
		}
	}

	const self = {
		updates,
		perform: () => value
	}

	const stop_observing = event.observe()
	const leave_propagation = event.join_propagation(
		instant => {
			if (!instant.cache.has(updates)) {
				const cache = { computed: false, value: _nothing }
				instant.cache.set(updates, cache)
				for (const f of dependants.values()) {
					f(instant)
				}
				// Ensure this is computed, regardless of dependants.
				instant.computations.push(instant => get_value_with_cache(instant, cache, updates))
			}
		}
	)

	register_finalizer(self, () => {
		stop_observing()
		leave_propagation()
	})

	const instant = event.instant()
	if (instant !== null) {
		const cache = { computed: false, value: _nothing }
		instant.cache.set(updates, cache)
		instant.computations.push(instant => get_value_with_cache(instant, cache, updates))
	}

	return self
}
