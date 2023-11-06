import { get_computation, get_value, is_occurring } from '../Occurrences/internal/computation.js'
import { create as create_event } from '../Event/create.js'

// TODO: this is rnd/wip
// TODO: what about completion? and this isn't a great api anyway
export const produces = values => {
	const event = create_event()
	return {
		event,
		caused: subject => {
			const results = []

			const leave_propagation = subject.occurrences.join_propagation(instant => {
				const computation = get_computation(subject.occurrences.compute, instant)
				if (is_occurring(computation)) {
					results.push(get_value(computation))
				}
			})

			for (const value of values) {
				event.produce(value)
			}

			leave_propagation()

			return results
		}
	}
}

// TODO: remove remnants of failed ideas:
// import { join_propagation } from '../Occurrences/internal/join_propagation.js'
// import { produce } from '../Occurrences/internal/produce.js'
// import { create as create_instant } from '../Instant/create.js'
// import { no_op } from '../util/no_op.js'

// export const produces = values => {
// 	const self = {
// 		occurrences: {
// 			compute: Symbol(),
// 			join_propagation: f => {
// 				for (const [ i, value ] of values.entries()) {
// 					console.log('join prop', value)
// 					const instant = create_instant()
// 					instant.cache.set(self.occurrences.compute, { compute_value: () => value, value })
// 					if (i === values.length - 1) {
// 						instant.cache.set(self.completed.updates.compute, { compute_value: () => true, value: true })
// 					}
// 					f(instant)
// 					for (const f of instant.post_computations) {
// 						f()
// 					}
// 				}
// 				return 
// 			}
// 		},
// 		completed: {
// 			updates: {
// 				compute: Symbol(),
// 				join_propagation: f => {
// 					const instant = create_instant()
// 					instant.cache.set(self.completed.updates.compute, { compute_value: () => true, value: true })
// 					f(instant)
// 					for (const f of instant.post_computations) {
// 						f()
// 					}
// 					return no_op
// 				}
// 			},
// 			perform: () => false
// 		}
// 	}

// 	return self
// }
