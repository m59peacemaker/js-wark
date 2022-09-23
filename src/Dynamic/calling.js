import { _calling as Event_calling } from '../Event/calling.js'
import { nothing } from '../Event/internal/nothing.js'

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
		updates: f => f(updates)
	}
}

export const calling = f => dynamic => {
	const queue = []
	let self

	dynamic(dynamic =>
		dynamic.updates(dynamic_updates =>
			dynamic_updates.complete(dynamic_updates_complete => {
				self = _calling (f, dynamic, dynamic_updates, dynamic_updates_complete)
				while (queue.length > 0) {
					queue.pop()(self)
				}
			})
		)
	)

	return f => self === undefined ? queue.push(f) : f(self)
}
