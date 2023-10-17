import { calling as _calling } from '../Occurrences/calling.js'

export const calling = f => input_event => {
	if (input_event.is_complete) {
		return never
	} else {
		const [ occurrences, leave_propagation ] = _calling (f) (input_event)
		const leave_completion_propagation = input_event.completion.join_propagation(instant => {
			instant.post_computations.push(() => {
				self.is_complete = true
				leave_propagation()
				leave_completion_propagation()
			})
		})

		const self = {
			occurrences,
			completion: input_event.completion,
			is_complete: false
		}

		return self
	}
		// const occurrences = _map (f) (input_event)

		// const self = {
		// 	occurrences,
		// 	completion: input_event.completion,
		// 	is_complete: input_event.is_complete
		// }

		// if (input_event.is_complete === false) {
		// 	const leave_propagation = occurrences.join_propagation(instant => {
		// 		instant.computations.push(instant => {
		// 			const computation = get_computation(occurrences, instant)
		// 			if (is_occurring(computation)) {
		// 				get_value(computation)
		// 			}
		// 		})
		// 	})
		// 	const leave_completion_propagation = input_event.completion.join_propagation(instant => {
		// 		instant.post_computations.push(() => {
		// 			self.is_complete = true
		// 			leave_propagation()
		// 			leave_completion_propagation()
		// 		})
		// 	})
		// }

		// return self
}
