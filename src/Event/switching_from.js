import { get_value, get_computation, is_occurring } from '../Occurrences/internal/computation.js'
import { never } from './never.js'
import { register_finalizer } from '../finalization.js'

/*
	johnny:
		must finish frp

	source event:
		it must always be in the propagation of the source event, until it completes, to keep track of the current focused event (a Dynamic)
		the source event's occurrence and value must be checked during computation phase
		focused_event = source_event_value in post computation phase

	source event completion:
		it must always be in the propagation of the source event's completion, until it occurs, to then leave the source event propagation and its completion propagation.

		A difference from merge's implementation

	focused event:
		needs only to be in the propagation of its focused event when it has stateful dependants, to continue the propagation down to them
		no internal interest in checking the focused events occurrence or value, only needs to check these if a downstream checks the switch's occurrence and value.

	focused event completion:
		needs only to be in the propagation of its focused event's completion when the switch's completion has stateful dependants, to continue the propagation down to them
*/

/*
	TODO:
		It is a potential inefficiency that all the `compute` functions interact with the instant cache
		`get_computation(compute_fn, instant)`
		as opposed to directly calling them in `join_propagation`.
		They must each be called only once per instant, but it needs investigation which can be called more than once
		if not for cache.
		Here are some thoughts (take with grain of salt):
		`compute_focus_update` is cached so that it can be computed from the source event propagation, focused_event_propagation, or when dependants compute it from the focused event propagation.
		`compute_focused_event_propagation` is cached so that 
*/
const source_switching_from = (initial_focused_event, source_event) => {
	const dependants = new Map()
	const completion_dependants = new Map()
	let focused_event = initial_focused_event
	let leave_focused_event_propagation = null
	let leave_focused_event_completion_propagation = null

	/*
		`compute_focus_update` must be computed when the source event occurs, until the source event is complete.

		Dependants join during the computation phase,
		and leave during the post computation phase.
		During the computation phase, the switch could possibly have no dependants.
		During the post computation phase, the switch could possibly gain dependants.

		If the switch has no dependants,
			its `leave_focused_event_propagation` will be null and dependants.size === 0
			If compute_focus_update is called before anything joins propagation,
				There is no leave propagation function to call (leave_focused_event_propagation is null)
				focused_event variable must be updated,
				but its propagation should not be joined.
				Then if anything joins the switch's propagation, the switch will join the propagation of the updated focused event
	*/

	const compute_focus_update = instant => {
		const source_computation = get_computation(source_event.occurrences.compute, instant)
		if (is_occurring(source_computation)) {
			focused_event = get_value(source_computation)
			// TODO: should this be here? should it use the compute cache?
			if (is_occurring (get_computation(focused_event.occurrences.compute, instant))) {
				for (const f of dependants.values()) {
					f(instant)
				}
			}
			// TODO: this is almost definitely wrong? should be checking if updates is occurring!
			// if (focused_event.is_complete.perform()) {
			// 	for (const f of completion_dependants.values()) {
			// 		f(instant)
			// 	}
			// }
			instant.post_computations.push(() => {
				if (focused_event.is_complete.perform()) {
					if (dependants.size > 0) {
						leave_focused_event_propagation()
						leave_focused_event_completion_propagation()
					}
				} else {
					// this is probably equivalent to checking if `dependants.size > 0`
					if (leave_focused_event_propagation !== null) {
						leave_focused_event_propagation()
						leave_focused_event_propagation = join_focused_event_propagation(focused_event)
					}
					// this is probably equivalent to checking if `dependants.size + completion_dependants.size > 0`
					if (dependants.size + completion_dependants.size > 0) {
							leave_focused_event_completion_propagation()
							leave_focused_event_completion_propagation = join_focused_event_completion_propagation(focused_event)
					}
				}
			})
		}
	}

	const compute_focus_update_completion = instant => {
		const computation = get_computation(source_event.is_complete.updates.compute, instant)
		if (is_occurring(computation)) {
			// TODO: use compute cache?
			for (const f of completion_dependants.values()) {
				f(instant)
			}
			instant.post_computations.push(() => {
				leave_source_event_propagation()
				leave_source_event_completion_propagation()
				unregister_finalizer()
			})
		}
	}

	const leave_source_event_propagation = source_event.occurrences.join_propagation(instant => {
		get_computation(compute_focus_update, instant)
	})

	const leave_source_event_completion_propagation = source_event.is_complete.updates.join_propagation(instant => {
		get_computation(compute_focus_update_completion, instant)
	})

	const compute_focused_event_propagation = instant => {
		// TODO: it works with or without this check, but it would be good to be sure it is better to have this check
		if (is_occurring(get_computation(focused_event.occurrences.compute, instant))) {
			for (const f of dependants.values()) {
				f(instant)
			}
		}
	}

	const join_focused_event_propagation = focused_event =>
		focused_event.occurrences.join_propagation(instant => {
			if (source_event.is_complete.perform() === false) {
				// ensure focused event has been updated (avoid race with compute_focus_update from source event propagation)
				get_computation(compute_focus_update, instant)
			}
			get_computation(compute_focus_update, instant)
			get_computation(compute_focused_event_propagation, instant)
		})

	const join_focused_event_completion_propagation = focused_event =>
		focused_event.is_complete.updates.join_propagation(instant => {
			get_computation(compute_focused_event_completion, instant)
		})

	const compute_focused_event_completion = instant => {
		if (source_event.is_complete.perform() === false) {
			// ensure focused event has been updated (avoid race with compute_focus_update from source event propagation)
			get_computation(compute_focus_update, instant)
		}

		if (is_occurring(get_computation(focused_event.is_complete.updates.compute, instant))) {
			for (const f of completion_dependants.values()) {
				f(instant)
			}
			instant.post_computations.push(() => {
				// TODO: these conditions may not be efficient
				if (leave_focused_event_propagation !== null) {
					leave_focused_event_propagation()
					leave_focused_event_propagation = null
				}
				if (leave_source_event_completion_propagation !== null) {
					leave_focused_event_completion_propagation()
					leave_focused_event_completion_propagation = null
				}
			})
		}
	}

	const occurrences = {
		compute: instant => {
			const focused_event_computation = get_computation(focused_event.occurrences.compute, instant)
			return is_occurring(focused_event_computation)
				?
					() => get_value (focused_event_computation)
				:
					false
		},
		join_propagation: f => {
			const id = Symbol()
			dependants.set(id, f)
			if (dependants.size === 1) {
				leave_focused_event_propagation = join_focused_event_propagation(focused_event)
				leave_focused_event_completion_propagation = join_focused_event_completion_propagation(focused_event)
			}
			return () => {
				dependants.delete(id)
				if (dependants.length === 0) {
					leave_focused_event_propagation()
					leave_focused_event_propagation = null
				}
			}
		}
	}
	const is_complete = {
		updates: {
			compute: instant => {
				// console.log([
				// 	source_event.is_complete.perform(),
				// 	focused_event.is_complete.perform(),
				// 	is_occurring(get_computation(source_event.is_complete.updates.compute, instant)),
				// 	is_occurring(get_computation(focused_event.is_complete.updates.compute, instant))
				// ])

				if (source_event.is_complete.perform()) {
					const is_complete = focused_event.is_complete.perform()
						|| is_occurring(get_computation(focused_event.is_complete.updates.compute, instant))
					return is_complete && (() => true)
				} else {
					get_computation(compute_focus_update, instant)
					// TODO: this is redundant, should just need `focused_event` here, since focus update was computed
					// if (is_occurring(get_computation(source_event.is_complete.updates.compute, instant))) {
					// 	const source_event_computation = get_computation(source_event.occurrences.compute, instant)
					// 	const updated_focused_event = is_occurring(source_event_computation)
					// 		?
					// 			get_value(source_event_computation)
					// 		:
					// 			focused_event
					// 	const is_complete = is_occurring(get_computation(updated_focused_event.is_complete.updates.compute, instant)) && is_occurring(get_computation(source_event.is_complete.updates.compute, instant))
						// const is_complete = focused_event.is_complete.perform()
						// 	|| is_occurring(get_computation(focused_event.is_complete.updates.compute, instant))
						const focused_event_is_complete = focused_event.is_complete.perform()
							|| is_occurring(get_computation(focused_event.is_complete.updates.compute, instant))
						const is_complete = focused_event_is_complete && is_occurring(get_computation(source_event.is_complete.updates.compute, instant))
						return is_complete && (() => true)
					// } else {
					// 	return false
					// }
				}
			},
			join_propagation: f => {
				const id = Symbol()
				completion_dependants.set(id, f)
				if (completion_dependants.size + dependants.size === 1) {
					leave_focused_event_completion_propagation = join_focused_event_completion_propagation(focused_event)
				}
				return () => {
					completion_dependants.delete(id)
					if (completion_dependants.size + dependants.size === 0) {
						// TODO: the need for this check is sketchy to me
						if (leave_focused_event_completion_propagation !== null) {
							leave_focused_event_completion_propagation()
						}
					}
				}
			}
		},
		perform: () => source_event.is_complete.perform() && focused_event.is_complete.perform()
	}

	const self = {
		occurrences,
		is_complete
	}

	/*
		TODO: should `occurrences` and `is_complete` have their own individual finalizer?
	*/
	const unregister_finalizer = register_finalizer(self, () => {
		leave_source_event_propagation()
		leave_source_event_completion_propagation()
	})

	return self
}

export const switching_from = initial_focused_event => source_event => {
	if (source_event.is_complete.perform() && initial_focused_event.is_complete.perform()) {
		return never
	} else if (source_event.is_complete.perform()) {
		return initial_focused_event
	} else {
		return source_switching_from(initial_focused_event, source_event)
	}
}
