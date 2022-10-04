import { _calling as Event_calling } from '../Event/calling.js'
import { nothing } from '../Event/internal/nothing.js'
import { _use } from '../Reference/use.js'

const _calling = (f, dynamic, dynamic_updates, dynamic_updates_complete) => {
	const updates = Event_calling (f, dynamic_updates, dynamic_updates_complete)

	let value = f (dynamic.run())

	const unobserve = updates.observe({
		pre_compute: () => {},
		compute: () => {
			if (updates.value !== nothing) {
				value = updates.value
			}
		}
	})

	const unobserve_complete = dynamic_updates_complete.observe({
		pre_compute: () => {},
		compute: dependency => {
			if (dependency.value !== nothing) {
				dependency.propagation.post_propagation.add(() => {
					unobserve()
					unobserve_complete()
				})
			}
		}
	})

	return {
		value,
		updates
	}
}

export const calling = f => dynamic =>
	_use(dynamic, dynamic =>
		_use(dynamic.updates, dynamic_updates =>
			_use(dynamic_updates.complete, dynamic_updates_complete =>
				_calling (f, dynamic, dynamic_updates, dynamic_updates_complete)
			)
		)
	)
