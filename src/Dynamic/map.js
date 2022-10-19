import { computed_in_instant } from '../Event/internal/computed_in_instant.js'
import { get_value } from '../Event/internal/get_value.js'
import { _nothing } from '../Event/internal/_nothing.js'
import { undetermined } from './internal/undetermined.js'
import { map as Event_map } from '../Event/map.js'

export const map = f => dynamic => {
	let value = undetermined

	const updates = Event_map (f) (dynamic.updates)
	const receive_update = instant => {
		instant.post_computations.push(instant => {
			if (computed_in_instant(instant, updates)) {
				const update_value = get_value(instant, updates)
				if (update_value !== _nothing) {
					value = update_value
				}
			} else {
				value = undetermined
			}
		})
	}

	const self = {
		updates,
		perform: () => {
			if (value === undetermined) {
				value = f (dynamic.perform())
			}
			return value
		},
		propagate: receive_update
	}

	updates.dependants.add(self)

	const instant = dynamic.updates.instant()
	if (instant !== null) {
		receive_update(instant)
	}

	return self
}
