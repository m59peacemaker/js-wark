import { catch_up_observer } from './internal/catch_up_observer.js'
import { nothing } from './internal/nothing.js'
import { nothing as public_nothing } from './nothing.js'
import { noop, pipe2 } from '../util.js'
import { compute_observers } from './internal/compute_observers.js'
import { pre_compute_observers } from './internal/pre_compute_observers.js'
import { Error_Cycle_Detected } from './Error_Cycle_Detected.js'
import { is_same_event_reference } from './internal/is_same_event_reference.js'
import { never } from './never.js'
import { _call } from '../Reference/call.js'
import { _use } from '../Reference/use.js'

// TODO: this shares a ton of code with create_merged_event
// TODO: does the complete event need the "*_observes_this_event"/cycle logic? If so, write tests for that. If not, remove that logic.
const create_merged_complete_event = (a, b) => {
	const observers = new Map()

	let unobserve_a
	let unobserve_b

	let unsettling = false

	let a_observes_this_event = false
	let b_observes_this_event = false

	const self = {
		computed: null,
		occurred: null,
		observers,
		settled: true,
		value: nothing,
		observe: observer => {
			const id = Symbol()
			observers.set(id, observer)

			if (observers.size === 1) {
				_call(a.observe, a_observe =>
					_call(b.observe, b_observe => {
						unobserve_a = a_observe(dependency_observer)
						unobserve_b = b_observe(dependency_observer)
					})
				)
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
			self.computed = dependency.computed

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
			const { post_propagation } = self.computed

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
					const value = a.occurred && b.occurred
						? a.value === nothing ? b.value : a.value
						: public_nothing
					if (value !== public_nothing) {
						self.occurred = self.computed
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

const create_merged_event = (f, a, b, a_complete, b_complete) => {
	const observers = new Map()

	let unobserve_a
	let unobserve_a_complete
	let unobserve_b
	let unobserve_b_complete

	let unsettling = false

	let a_observes_this_event = false
	let b_observes_this_event = false

	let a_is_complete = false
	let b_is_complete = false

	const self = {
		computed: null,
		occurred: null,
		observers,
		settled: true,
		value: nothing,
		observe: observer => {
			const id = Symbol()
			observers.set(id, observer)

			if (observers.size === 1) {
				// TODO: use `call` rather than `use` ?
				_call(a.observe, a_observe =>
					_call(a_complete.observe, a_complete_observe =>
						_call(b.observe, b_observe =>
							_call(b_complete.observe, b_complete_observe => {
								unobserve_a = a_observe(dependency_observer)
								unobserve_b = b_observe(dependency_observer)
								unobserve_a_complete = a_complete_observe(dependency_complete_observer)
								unobserve_b_complete = b_complete_observe(dependency_complete_observer)
							})
						)
					)
				)
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
			self.computed = dependency.computed

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
			const { post_propagation } = self.computed

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
					const value = f (a_is_complete ? never : a, b_is_complete ? never : b)
					if (value !== public_nothing) {
						self.occurred = self.computed
						self.value = value
						post_propagation.add(() => self.value = nothing)
					}
				}
				compute_observers(self)
			}
		}
	}

	let complete_computed
	const dependency_complete_observer = {
		pre_compute: dependency => {
			complete_computed = dependency.computed
		},
		compute: dependency => {
			if (a_complete.value !== nothing && is_same_event_reference(a_complete, dependency)) {
				complete_computed.post_propagation.add(() => {
					a_is_complete = true
					unobserve_a()
					unobserve_a_complete()
				})
			}
			if (b_complete.value !== nothing && is_same_event_reference(b_complete, dependency)) {
				complete_computed.post_propagation.add(() => {
					b_is_complete = true
					unobserve_b()
					unobserve_b_complete()
				})
			}
		}
	}

	return self
}

export const _merge_2_with = (f, a, b, a_complete, b_complete) => {
	const merge_f = (a, b) => f
		(a.value === nothing ? public_nothing : a.value)
		(b.value === nothing ? public_nothing : b.value)
	const self = create_merged_event (merge_f, a, b, a_complete, b_complete)
	const complete = create_merged_complete_event (a_complete, b_complete)
	complete.complete = complete
	self.complete = complete
	return self
}

export const merge_2_with = f => a => b =>
	_use(a, a =>
		_use(a.complete, a_complete =>
			_use(b, b =>
				_use(b.complete, b_complete =>
					_merge_2_with (f, a, b, a_complete, b_complete)
				)
			)
		)
	)
