import { get_value } from './internal/get_value.js'
import { get_value_with_cache } from './internal/get_value_with_cache.js'
import { _nothing } from './internal/_nothing.js'

import { register_finalizer } from '../finalization.js'

export const scan = reducer => initial_value => event => {
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
		propagate: instant => {
			if (!instant.cache.has(updates)) {
				const cache = { computed: false, value: _nothing }
				instant.cache.set(updates, cache)
				for (const dependant of updates.dependants) {
					dependant.propagate(instant)
				}
				// Ensure this is computed, regardless of dependants.
				instant.computations.push(instant => get_value_with_cache(instant, cache, updates))
			}
		},
		dependants: new Set()
	}

	const self = {
		updates,
		perform: () => value
	}

	const stop_observing_event = event.observe()
	event.dependants.add(updates)
	register_finalizer(self, () => {
		stop_observing_event()
		event.dependants.delete(updates)
	})

	const instant = event.instant()
	if (instant !== null) {
		const cache = { computed: false, value: _nothing }
		instant.cache.set(updates, cache)
		instant.computations.push(instant => get_value_with_cache(instant, cache, updates))
	}

	return self
}
