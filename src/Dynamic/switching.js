import { get_value, get_computation, is_occurring } from '../Occurrences/internal/computation.js'

export const switching = outer_dynamic => {
	const dependants = new Map()
	const completion_dependants = new Map()
	let leave_outer_dynamic_updates_propagation = null
	let leave_inner_event_propagation = null
	let leave_outer_dynamic_updates_completion_propagation = null
	let leave_inner_event_completion_propagation = null

	const propagate = instant => {
		for (const f of dependants.values()) {
			f(instant)
		}
	}

	const propagate_completion = instant => {
		for (const f of completion_dependants.values()) {
			f(instant)
		}
	}

	const join_inner_event_propagation = () => {
		const inner_event = outer_dynamic.perform()
		leave_inner_event_propagation = inner_event.occurrences.join_propagation(instant => {
			if (is_occurring(get_computation(inner_event.occurrences.compute, instant))) {
				get_computation(propagate, instant)
			}
		})
	}

	const join_inner_event_completion_propagation = () => {
		const inner_event = outer_dynamic.perform()
		leave_inner_event_completion_propagation = inner_event.is_complete.updates.join_propagation(instant => {
			if (is_occurring(get_computation(inner_event.is_complete.updates.compute, instant))) {
				get_computation(propagate_completion, instant)
			}
		})
	}

	return {
		occurrences: {
			compute: instant => {
				if (outer_dynamic.updates.is_complete.perform()) {
					const inner_event = outer_dynamic.perform()
					const inner_event_computation = get_computation(inner_event.occurrences.compute, instant)
					return is_occurring(inner_event_computation)
						?
							() => get_value (inner_event_computation)
						:
							false
				} else {
					const outer_dynamic_updates_computation = get_computation(
						outer_dynamic.updates.occurrences.compute,
						instant
					)
					if (is_occurring(outer_dynamic_updates_computation)) {
						const focusing_inner_event = get_value(outer_dynamic_updates_computation)
						const inner_event_computation = get_computation(focusing_inner_event.occurrences.compute, instant)
						return is_occurring(inner_event_computation)
							?
								() => get_value(inner_event_computation)
							:
								false
					} else {
						const focused_inner_event = outer_dynamic.perform()
						const inner_event_computation = get_computation(focused_inner_event.occurrences.compute, instant)
						return is_occurring(inner_event_computation)
							?
								() => get_value(inner_event_computation)
							:
								false
					}
				}
			},
			join_propagation: f => {
				const id = Symbol()
				dependants.set(id, f)
				if (dependants.size === 1) {
					leave_outer_dynamic_updates_propagation = outer_dynamic.updates.occurrences.join_propagation(instant => {
						if (is_occurring(get_computation(outer_dynamic.updates.occurrences.compute, instant))) {
							get_computation(propagate, instant)
							instant.post_computations.push(instant => {
								if (dependants.size > 0) {
									leave_inner_event_propagation()
									join_inner_event_propagation()
								}
							})
						}
					})
					join_inner_event_propagation()
				}
				return () => {
					dependants.delete(id)
					if (dependants.size === 0) {
						leave_outer_dynamic_updates_propagation()
						leave_outer_dynamic_updates_propagation = null
						leave_inner_event_propagation()
						leave_inner_event_propagation = null
					}
				}
			}
		},
		is_complete: {
			perform: () =>
				outer_dynamic.updates.is_complete.perform() && outer_dynamic.perform().is_complete.perform()
			,
			updates: {
				compute: instant => {
					if (outer_dynamic.updates.is_complete.perform()) {
						const inner_event = outer_dynamic.perform()
						const is_complete = inner_event.is_complete.perform()
							|| is_occurring(get_computation(inner_event.is_complete.updates.compute, instant))
						return is_complete && (() => true)
					} else {
						const outer_dynamic_updates_computation = get_computation(
							outer_dynamic.updates.occurrences.compute,
							instant
						)
						const inner_event = is_occurring(outer_dynamic_updates_computation)
							?
								get_value(outer_dynamic_updates_computation)
							:
								outer_dynamic.perform()
						const inner_event_is_complete = inner_event.is_complete.perform()
							|| is_occurring(get_computation(inner_event.is_complete.updates.compute, instant))
						const is_complete = inner_event_is_complete
							&& is_occurring(get_computation(outer_dynamic.updates.is_complete.updates.compute, instant))
						return is_complete && (() => true)
					}
				},
				join_propagation: f => {
					const id = Symbol()
					completion_dependants.set(id, f)
					if (completion_dependants.size === 1) {
						leave_outer_dynamic_updates_completion_propagation = outer_dynamic.updates.is_complete.updates.join_propagation(instant => {
							if (is_occurring(get_computation(outer_dynamic.updates.is_complete.updates.compute, instant))) {
								get_computation(propagate_completion, instant)
								instant.post_computations.push(instant => {
									if (completion_dependants.size > 0) {
										leave_inner_event_completion_propagation()
										join_inner_event_completion_propagation()
									}
								})
							}
						})
						join_inner_event_completion_propagation()
					}
					return () => {
						completion_dependants.delete(id)
						if (completion_dependants.size === 0) {
							leave_outer_dynamic_updates_completion_propagation()
							leave_outer_dynamic_updates_completion_propagation = null
							leave_inner_event_completion_propagation()
							leave_inner_event_completion_propagation = null
						}
					}
				}
			}
		}
	}
}
