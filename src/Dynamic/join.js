import { get_value, get_computation, is_occurring } from '../Occurrences/internal/computation.js'

export const join = outer_dynamic => {
	const dependants = new Map()
	const completion_dependants = new Map()
	let leave_outer_dynamic_updates_propagation = null
	let leave_inner_dynamic_updates_propagation = null
	let leave_outer_dynamic_updates_completion_propagation = null
	let leave_inner_dynamic_updates_completion_propagation = null

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

	const join_inner_dynamic_updates_propagation = () => {
		const inner_dynamic = outer_dynamic.perform()
		leave_inner_dynamic_updates_propagation = inner_dynamic.updates.occurrences.join_propagation(instant => {
			if (is_occurring(get_computation(inner_dynamic.updates.occurrences.compute, instant))) {
				get_computation(propagate, instant)
			}
		})
	}

	const join_inner_dynamic_updates_completion_propagation = () => {
		const inner_dynamic = outer_dynamic.perform()
		leave_inner_dynamic_updates_completion_propagation = inner_dynamic.updates.completed.updates.join_propagation(instant => {
			if (is_occurring(get_computation(inner_dynamic.updates.completed.updates.compute, instant))) {
				get_computation(propagate_completion, instant)
			}
		})
	}

	const updates = {
		occurrences: {
			compute: instant => {
				// TODO: simplify these conditions if possible
				if (outer_dynamic.updates.completed.perform()) {
					const inner_dynamic = outer_dynamic.perform()
					const inner_updates_computation = get_computation(inner_dynamic.updates.occurrences.compute, instant)
					return is_occurring(inner_updates_computation)
						?
							() => get_value (inner_updates_computation)
						:
							false
				} else {
					const outer_dynamic_updates_computation = get_computation(
						outer_dynamic.updates.occurrences.compute,
						instant
					)
					if (is_occurring(outer_dynamic_updates_computation)) {
						const inner_dynamic = get_value(outer_dynamic_updates_computation)
						const inner_updates_computation = get_computation(inner_dynamic.updates.occurrences.compute, instant)
						return is_occurring(inner_updates_computation)
							?
								() => get_value(inner_updates_computation)
							:
								inner_dynamic.perform
					} else {
						const inner_dynamic = outer_dynamic.perform()
						const inner_updates_computation = get_computation(inner_dynamic.updates.occurrences.compute, instant)
						/* TODO: maybe no need to check whether this occurring because `compute` should only be called if the outer dynamic is updating or the inner dynamic is updating
						*/
						return is_occurring(inner_updates_computation)
							?
								() => get_value (inner_updates_computation)
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
									leave_inner_dynamic_updates_propagation()
									join_inner_dynamic_updates_propagation()
								}
							})
						}
					})
					join_inner_dynamic_updates_propagation()
				}
				return () => {
					dependants.delete(id)
					if (dependants.size === 0) {
						leave_outer_dynamic_updates_propagation()
						leave_outer_dynamic_updates_propagation = null
						leave_inner_dynamic_updates_propagation()
						leave_inner_dynamic_updates_propagation = null
					}
				}
			}
		},
		completed: {
			perform: () =>
				outer_dynamic.updates.completed.perform() && outer_dynamic.perform().updates.completed.perform()
			,
			updates: {
				compute: instant => {
					if (outer_dynamic.updates.completed.perform()) {
						const inner_updates = outer_dynamic.perform().updates
						const is_complete = inner_updates.completed.perform()
							|| is_occurring(get_computation(inner_updates.completed.updates.compute, instant))
						return is_complete && (() => true)
					} else {
						const outer_dynamic_updates_computation = get_computation(
							outer_dynamic.updates.occurrences.compute,
							instant
						)
						const inner_dynamic = is_occurring(outer_dynamic_updates_computation)
							?
								get_value(outer_dynamic_updates_computation)
							:
								outer_dynamic.perform()
						const inner_dynamic_updates_is_complete = inner_dynamic.updates.completed.perform()
							|| is_occurring(get_computation(inner_dynamic.updates.completed.updates.compute, instant))
						const is_complete = inner_dynamic_updates_is_complete
							&& is_occurring(get_computation(outer_dynamic.updates.completed.updates.compute, instant))
						return is_complete && (() => true)
					}
				},
				join_propagation: f => {
					const id = Symbol()
					completion_dependants.set(id, f)
					if (completion_dependants.size === 1) {
						leave_outer_dynamic_updates_completion_propagation = outer_dynamic.updates.completed.updates.join_propagation(instant => {
							if (is_occurring(get_computation(outer_dynamic.updates.completed.updates.compute, instant))) {
								get_computation(propagate_completion, instant)
								instant.post_computations.push(instant => {
									if (completion_dependants.size > 0) {
										leave_inner_dynamic_updates_completion_propagation()
										join_inner_dynamic_updates_completion_propagation()
									}
								})
							}
						})
						join_inner_dynamic_updates_completion_propagation()
					}
					return () => {
						completion_dependants.delete(id)
						if (completion_dependants.size === 0) {
							leave_outer_dynamic_updates_completion_propagation()
							leave_outer_dynamic_updates_completion_propagation = null
							leave_inner_dynamic_updates_completion_propagation()
							leave_inner_dynamic_updates_completion_propagation = null
						}
					}
				}
			}
		}
	}

	return {
		perform: () => outer_dynamic.perform().perform(),
		updates
	}
}
