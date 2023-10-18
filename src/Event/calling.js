import { calling as _calling } from '../Occurrences/calling.js'
import { never } from './never.js'
import { is_occurring, get_computation } from '../Occurrences/internal/computation.js'

export const calling = f => input_event => {
	if (input_event.is_complete.perform()) {
		return never
	} else {
		const [ occurrences, leave_propagation ] = _calling (f) (input_event.occurrences)
		const leave_completion_propagation = input_event.is_complete.updates.join_propagation(instant => {
			instant.post_computations.push(() => {
				if (is_occurring(get_computation(input_event.is_complete.updates, instant))) {
					leave_propagation()
					leave_completion_propagation()
				}
			})
		})

		const self = {
			occurrences,
			is_complete: input_event.is_complete
		}

		return self
	}
}
