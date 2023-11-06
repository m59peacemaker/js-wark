import { never } from './never.js'
import { get_computation, get_value, is_occurring } from '../Occurrences/internal/computation.js'

export const calling = f => x => {
	if (x.completed.perform()) {
		return never
	} else {
		const occurrences = {
			compute: instant => {
				const x_computation = get_computation(x.occurrences.compute, instant)
				return is_occurring(x_computation)
					?
						() => f(get_value(x_computation))
					:
						false
			},
			join_propagation: x.occurrences.join_propagation
		}

		const compute_occurrence = instant => {
			const computation = get_computation(occurrences.compute, instant)
			if (is_occurring(computation)) {
				get_value(computation)
			}
		}

		const leave_propagation = x.occurrences.join_propagation(instant => {
			get_computation(compute_occurrence, instant)
		})

		const compute_completion = instant => {
			if (is_occurring(get_computation(x.completed.updates.compute, instant))) {
				instant.post_computations.push(() => {
					leave_propagation()
					leave_completion_propagation()
				})
			}
		}

		const leave_completion_propagation = x.completed.updates.join_propagation(instant => {
			/*
				TODO:
				As long as get_computation calls the compute function, this only needs to get the computation
				This could all be implemented better, though.
				At least, `get_computation` could be renamed to `compute`:
				const x_state = compute(x.occurrences.compute, instant)
				is_occurring(x_state)
				get_value(x_state)
			*/
			get_computation(compute_completion, instant)
			// compute(compute_completion, instant)
			// instant.computations.push(instant => get_computation(compute_completion, instant))
		})

		return {
			occurrences,
			completed: x.completed
		}
	}
}
