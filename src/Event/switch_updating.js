import { get_value, get_computation, is_occurring } from '../Occurrences/internal/computation.js'

/*
	source event:
		it must always be in the propagation of the source event, until it completes, to keep track of the current focused event (a Dynamic)
		the source event's occurrence and value must be checked during computation phase
		focused_event = source_event_value in post computation phase

	source event completion:
		it must always be in the propagation of the source event's completion, until it occurs, to then leave the source event propagation and its completion propagation.

	focused event:
		needs only to be in the propagation of its focused event when it has stateful dependants, to continue the propagation down to them
		no internal interest in checking the focused events occurrence or value, only needs to check these if a downstream checks the switch's occurrence and value.

	focused event completion:
		needs only to be in the propagation of its focused event's completion when the switch's completion has stateful dependants, to continue the propagation down to them
*/

const source_switch_updating = (resolve, initial_focused_event, source_event) => {
	const dependants = new Map()
	const completion_dependants = new Map()
	let focused_event = initial_focused_event

	const join_source_event_completion_propagation = () => {
		leave_source_event_completion_propagation = source_event.is_complete.updates.join_propagation(instant => {
			for (const f of completion_dependants.values()) {
				f(instant)
			}
			instant.computations.push(instant => {
				if (is_occurring(get_computation(source_event.is_complete.updates, instant))) {
					instant.post_computations.push(() => {
						leave_source_event_propagation()
						leave_source_event_completion_propagation()
					})
				}
			})
		})
	}
	const join_focused_event_completion_propagation = () => {
		leave_focused_event_completion_propagation = focused_event.is_complete.updates.join_propagation(instant => {
			for (const f of completion_dependants.values()) {
				f(instant)
			}
			instant.computations.push(instant => {
				is_occurring(get_computation(focused_event.is_complete.updates, instant))) {
					instant.post_computations.push(() => {
						leave_focused_event_propagation()
						leave_focused_event_completion_propagation()
					})
				}
			})
		})
	}

	const self = {
		occurrences: {
			compute: instant => {
				if (source_event.is_complete.perform()) {
					const focused_event_computation = get_computation(focused_event, instant)
					return is_occurring(focused_event_computation)
						?
							() => get_value (focused_event_computation)
						:
							false
				} else {
					const source_event_computation = get_computation(source_event, instant)
					if (is_occurring(source_event_computation)) {
						const focusing_event = get_value(source_event_computation)

						if (is_occurring(get_computation(source_event.is_complete.updates, instant))) {
							instant.post_computations.push(() => {
								leave_source_event_propagation()
							})
						}

						if (is_occurring(get_computation(focusing_event.is_complete.updates, instant))) {
							instant.post_computations.push(() => {
								leave_focused_event_propagation()
							})
						} else {
							instant.post_computations.push(() => {
								leave_focused_event_propagation()
								focused_event = focusing_event
								join_focused_event_propagation()
							})
						}

						const resolved_event = resolve (focused_event) (focusing_event)
						const resolved_event_computation = get_computation(resolved_event, instant)
						return is_occurring(resolved_event_computation)
							?
								() => get_value(resolved_event_computation)
							:
								false
				}

				const source_event_computation = get_computation(source_event, instant)
				if (!source_event.is_complete.perform() && is_occurring(source_event_computation)) {
					const focusing_event = get_value(source_event_computation)

					instant.post_computations.push(() => {
						switch_focused_event(focusing_event)
					})

					const resolved_event = resolve (focused_event) (focusing_event)
					const resolved_event_computation = get_computation(resolved_event, instant)
					return is_occurring(resolved_event_computation)
						?
							() => get_value(resolved_event_computation)
						:
							false
				} else {
					const focused_event_computation = get_computation(focused_event, instant)
					return is_occurring(focused_event_computation)
						?
							() => get_value (focused_event_computation)
						:
							false
				}
			},
			join_propagation: f => {
				const id = Symbol()
				dependants.set(id, f)
				if (dependants.size === 1) {
					join_focused_event_propagation()
				}
				return () => {
					dependants.delete(id)
					if (dependants.length === 0) {
						leave_focused_event_propagation()
						leave_focused_event_propagation = no_op
					}
				}
			}
		}
	}

	const leave_source_event_propagation = source_event.join_propagation(instant => {
		for (const f of dependants.values()) {
			f(instant)
		}
		instant.computations.push(instant => {
			const computation = get_computation(self, instant)
			// no need to get the value
			is_occurring(computation)
		})
	})

	const leave_source_event_completion_propagation = source_event.is_complete.updates.join_propagation(instant => {
		instant.post_computations.push(instant => {
			leave_source_event_propagation()
			leave_source_event_completion_propagation()
			unregister_finalizer()
		})
	})

	const unregister_finalizer = register_finalizer(occurrences, () => {
		leave_source_event_propagation()
		leave_source_event_completion_propagation()
	})

	return {
		is_complete: {
			updates: {
				compute: instant => {
					console.log([
						source_event.is_complete.perform(),
						focused_event.is_complete.perform(),
						is_occurring(get_computation(source_event.is_complete.updates.compute)),
						is_occurring(get_computation(focused_event.is_complete.updates.compute))
					])
					if (source_event.is_complete.perform()) {
						const is_complete = focused_event.is_complete.perform()
							|| is_occurring(get_computation(focused_event.is_complete.updates, instant))
						return is_complete && () => true
					} else {
						if (is_occurring(get_computation(source_event.is_complete.updates, instant))) {
							const source_event_computation = get_computation(source_event.occurrences, instant)
							const focused_event = is_occurring(source_event_computation)
								?
									get_value(source_event_computation)
								:
									focused_event
							return focused_event.is_complete.perform()
								|| is_occurring(get_computation(focused_event.is_complete.updates, instant))
								&& () => true
						} else {
							return false
						}
					}
				},
				join_propagation: f => {
					const id = Symbol()
					completion_dependants.set(id, f)
					if (completion_dependants.size + dependants.size === 1) {
						join_completion_propagation()
					}
					return () => {
						completion_dependants.delete(id)
						if (completion_dependants.size + dependants.size === 0) {
							leave_source_event_completion_propagation()
							leave_focused_event_completion_propagation()
						}
					}
				}
			},
			perform: () => source_event.is_complete.perform() && focused_event.is_complete.perform()
		},
		occurrences
	}
}


export const switch_updating = resolve => initial_focused_event => source_event => {
	if (source_event.is_complete.perform() && initial_focused_event.is_complete.perform()) {
		return never
	} else if (source_event.is_complete.perform()) {
		return initial_focused_event
	} else {
		return source_switch_updating(resolve, initial_focused_event, source_event)
	}
}

	// let focused_event = initial_focused_event
	// let is_complete = false
	// let leave_focused_event_propagation = no_op
	// let leave_focused_event_completion_propagation = no_op
	// const dependants = new Map()

	// const join_focused_event_propagation = () => {
	// 	leave_focused_event_propagation = focused_event.join_propagation(instant => {
	// 		for (const f of dependants.values()) {
	// 			f(instant)
	// 		}
	// 	})
	// }

	// const switch_focused_event = event => {
	// 	leave_focused_event_propagation()
	// 	leave_focused_event_completion_propagation()
	// 	focused_event = event
	// 	if (dependants.size > 0) {
	// 		join_focused_event_propagation()
	// 	}
	// 	leave_focused_event_completion_propagation = focused_event.is_completes.updates.join_propagation(instant => {
	// 		instant.post_computations.push(() => {
	// 		// focused_event_is_complete = true
	// 			leave_focused_event_propagation()
	// 			leave_focused_event_completion_propagation()
	// 		})
	// 	})
	// }

	// const self = {

	// const leave_source_event_propagation = source_event.join_propagation(instant => {
	// 	for (const f of dependants.values()) {
	// 		f(instant)
	// 	}
	// 	instant.computations.push(instant => {
	// 		const computation = get_computation(self, instant)
	// 		if (is_occurring(computation)) {
	// 			// Ensure this computes, regardless of dependants.
	// 			get_value(computation)
	// 		}
	// 	})
	// })

	// const leave_source_event_completion_propagation = source_event.is_complete.updates.join_propagation(instant => {
	// 	instant.post_computations.push(instant => {
	// 		// source_event_is_complete = true
	// 		leave_source_event_propagation()
	// 		leave_source_event_completion_propagation()
	// 		unregister_finalizer()
	// 	})
	// })

	// const unregister_finalizer = register_finalizer(self, leave_source_event_propagation)

	// return [
	// 	self,
	// 	leave_source_event_propagation
	// 	// () => leave_focused_event_propagation()
	// ]
// }
