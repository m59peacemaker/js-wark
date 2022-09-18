import { catch_up_observer } from './internal/catch_up_observer.js'
import { nothing } from './internal/nothing.js'
import { nothing as public_nothing } from './nothing.js'
import { noop, pipe2 } from '../util.js'
import { compute_observers } from './internal/compute_observers.js'
import { pre_compute_observers } from './internal/pre_compute_observers.js'
import { Error_Cycle_Detected } from './Error_Cycle_Detected.js'
import { is_same_event_reference } from './internal/is_same_event_reference.js'
import { never } from './never.js'

// TODO: this shares a ton of code with create_merged_event
// TODO: does the complete event need the "*_observers_this_event"/cycle logic? If so, write tests for that. If not, remove that logic.
const create_merged_complete_event = (a, b) => {
	const observers = new Map()

	let unobserve_a
	let unobserve_b

	let unsettling = false

	let a_observes_this_event = false
	let b_observes_this_event = false

	const self = {
		observers,
		settled: true,
		time: null,
		value: nothing,
		observe: observer => {
			const id = Symbol()
			observers.set(id, observer)

			if (observers.size === 1) {
				unobserve_a = a.observe(dependency_observer)
				unobserve_b = b.observe(dependency_observer)
			}

			catch_up_observer (self, observer, false)

			return () => {
				observers.delete(id)
				if (observers.size === 0) {
					unobserve_a()
					unobserve_b()
				}
			}
		}
	}

	/*
		TODO: it might cleaner and/or more performant to make an observer for `a` and an observer for `b`,
		rather than sharing an observer and distinguishing the dependency via the input argument.
	*/
	const dependency_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			self.propagation = dependency.propagation

			if (unsettling) {
				if (cycle_allowed) {
					if (is_same_event_reference (a, dependency)) {
						a_observes_this_event = true
					} else {
						b_observes_this_event = true
					}
					return
				} else {
					throw new Error_Cycle_Detected()
				}
			}

			if (self.settled) {
				self.settled = false
				unsettling = true
				pre_compute_observers(self, cycle_allowed)
				unsettling = false
			}
		},
		compute: () => {
			const { time, post_propagation } = self.propagation

			/*
				if both dependencies are simultaneous,
				then the computation from the first dependency settles this event,
				so the second computation does nothing.
			*/
			if (self.settled) {
				return
			}

			if ((a.settled || a_observes_this_event) && (b.settled || b_observes_this_event)) {
				self.settled = true
				if (a.value !== nothing || b.value !== nothing) {
					const value = a.time && b.time
						? a.value === nothing ? b.value : a.value
						: public_nothing
					if (value !== public_nothing) {
						self.time = time
						self.value = value
						post_propagation.add(() => self.value = nothing)
					}
				}
				compute_observers(self)
			}
		}
	}

	return self
}

const create_merged_event = (f, a, b) => {
	const observers = new Map()

	let unobserve_a
	let unobserve_a_complete
	let unobserve_b
	let unobserve_b_complete

	let unsettling = false

	let a_observes_this_event = false
	let b_observes_this_event = false

	let a_complete = false
	let b_complete = false

	const self = {
		observers,
		settled: true,
		time: null,
		value: nothing,
		observe: observer => {
			const id = Symbol()
			observers.set(id, observer)

			if (observers.size === 1) {
				unobserve_a = a.observe(dependency_observer)
				unobserve_b = b.observe(dependency_observer)
				unobserve_a_complete = a.complete.observe(dependency_complete_observer)
				unobserve_b_complete = b.complete.observe(dependency_complete_observer)
			}

			catch_up_observer (self, observer, false)

			return () => {
				observers.delete(id)
				if (observers.size === 0) {
					unobserve_a()
					unobserve_b()
					unobserve_a_complete()
					unobserve_b_complete()
				}
			}
		}
	}

	/*
		TODO: it might cleaner and/or more performant to make an observer for `a` and an observer for `b`,
		rather than sharing an observer and distinguishing the dependency via the input argument.
	*/
	const dependency_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			self.propagation = dependency.propagation

			if (unsettling) {
				if (cycle_allowed) {
					// throw new Error('merge_2_with pre_compute cycle_allowed TODO:')
					if (is_same_event_reference (a, dependency)) {
						a_observes_this_event = true
					} else {
						b_observes_this_event = true
					}
					return
				} else {
					throw new Error_Cycle_Detected()
				}
			}

			if (self.settled) {
				self.settled = false
				unsettling = true
				pre_compute_observers(self, cycle_allowed)
				unsettling = false
			}
		},
		compute: () => {
			const { time, post_propagation } = self.propagation

			/*
				if both dependencies are simultaneous,
				then the computation from the first dependency settles this event,
				so the second computation does nothing.
			*/
			if (self.settled) {
				return
			}

			if ((a.settled || a_observes_this_event) && (b.settled || b_observes_this_event)) {
				self.settled = true
				if (a.value !== nothing || b.value !== nothing) {
					const value = f (a_complete ? never : a, b_complete ? never : b)
					if (value !== public_nothing) {
						self.time = time
						self.value = value
						post_propagation.add(() => self.value = nothing)
					}
				}
				compute_observers(self)
			}
		}
	}

	let complete_propagation
	const dependency_complete_observer = {
		pre_compute: dependency => {
			complete_propagation = dependency.propagation
		},
		compute: dependency => {
			if (a.complete.value !== nothing && is_same_event_reference(a.complete, dependency)) {
				complete_propagation.post_propagation.add(() => {
					a_complete = true
					unobserve_a()
					unobserve_a_complete()
				})
			}
			if (b.complete.value !== nothing && is_same_event_reference(b.complete, dependency)) {
				if (b.complete.value !== nothing) {
					complete_propagation.post_propagation.add(() => {
						b_complete = true
						unobserve_b()
						unobserve_b_complete()
					})
				}
			}
		}
	}

	return self
}

export const merge_2_with = f => a => b => {
	const merge_f = (a, b) => f
		(a.value === nothing ? public_nothing : a.value)
		(b.value === nothing ? public_nothing : b.value)
	const self = create_merged_event (merge_f, a, b)
	const complete = create_merged_complete_event (a.complete, b.complete)
	complete.complete = complete
	self.complete = complete
	return self
}
