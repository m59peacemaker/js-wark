import { noop } from '../util.js';
import { nothing } from './internal/nothing.js';
import { Error_Cycle_Detected } from './Error_Cycle_Detected.js';
import { compute_observers } from './internal/compute_observers.js';
import { pre_compute_observers } from './internal/pre_compute_observers.js';
import { _call } from '../Reference/call.js';
import { _use } from '../Reference/use.js';

const registry = new FinalizationRegistry(unobserve => unobserve());

const create_switch_complete = (initial_focused_event, source_event, source_event_complete) => {
	const observers = new Map();

	let focused_event = initial_focused_event.complete;
	let unobserve_focused_event = noop;
	let unsettling = false;
	let source_event_complete_observes_this_event = false;

	const pre_compute = (dependency, cycle_allowed) => {
		self.computed = dependency.computed;

		if (self.settled) {
			self.settled = false;
			unsettling = true;
			pre_compute_observers(self, cycle_allowed);
			unsettling = false;
		}
	};

	const source_event_complete_pre_compute = (dependency, cycle_allowed) => {
		self.computed = dependency.computed;

		// TODO: verify/test whether the commented code is needed or should be deleted
		if (unsettling) {
			// if (cycle_allowed) {
				source_event_complete_observes_this_event = true;
				return
			// } else {
				// throw new Error_Cycle_Detected()
			// }
		}

		source_event_complete_observes_this_event = false;

		if (self.settled) {
			self.settled = false;
			unsettling = true;
			pre_compute_observers(self, true);
			unsettling = false;
		}
	};

	const observe = observer => {
		const id = Symbol();
		observers.set(id, observer);

		if (observers.size === 1) {
			// it only needs to be observing the focused event when it is being observed
			// TODO: test and confirm that this is not a bad thing somehow ^
			unobserve_focused_event = focused_event.observe(focused_event_observer);
		}

		// TODO: unsure what `cycle_allowed` should be here...
		if (!source_event.settled || source_event.value !== nothing) {
			observer.pre_compute(self, false);
		}
		if (!focused_event.settled || focused_event.value !== nothing) {
			observer.pre_compute(self, false);
		}
		if (self.value !== nothing) {
			observer.compute(self);
		}

		return () => {
			observers.delete(id);
			if (observers.size === 0) {
				unobserve_focused_event();
			}
		}
	};

	const self = {
		computed: null,
		occurred: null,
		observers,
		settled: true,
		value: nothing,
		observe
	};
	self.complete = self;

	const settle = () => {
		const { post_propagation } = self.computed;
		self.settled = true;
		if (source_event.complete.occurred !== null && focused_event.occurred !== null) {
			self.occurred = self.computed;
			self.value = source_event.complete.value === nothing ? focused_event.value : source_event.complete.value;
			post_propagation.add(() => self.value = nothing);
		}
		compute_observers(self);
	};

	const focused_event_observer = {
		pre_compute,
		compute: () => {
			/*
				If the source_event has settled,
				then the focused event has been switched,
				so this event can settle here if source_event.complete is also settled.
			*/
			if (source_event.settled && (source_event.complete.settled || source_event_complete_observes_this_event)) {
				settle();
			}
		}
	};

	const source_event_observer = {
		pre_compute,
		compute: () => {
			if (source_event.value !== nothing) {
				_call(source_event.value, source_event_value => {
					_call(source_event_value.complete, source_event_value_complete => {
						focused_event = source_event_value_complete;
						const unobserve_now_focused_event = focused_event.observe(focused_event_observer);
						unobserve_focused_event();
						unobserve_focused_event = unobserve_now_focused_event;

						// NOTE: duplicated this due to the callback situation
						// TODO: make the implementation not so terrible
						if (focused_event.settled && (source_event.complete.settled || source_event_complete_observes_this_event)) {
							settle();
						}
					});
				});
			} else {
				/*
					The source event is settled (otherwise this observer compute should not have been called) and source_event.complete and the focused event may be settled.
					If all are settled, this event should settle.
					Otherwise, the source_event.complete and/or the focused event will call focused_event_observer.compute and this event can settle there.
				*/
				if (focused_event.settled && (source_event.complete.settled || source_event_complete_observes_this_event)) {
					settle();
				}
			}
		}
	};

	const source_event_complete_observer = {
		pre_compute: source_event_complete_pre_compute,
		compute: () => {
			if (self.settled) {
				return
			}
			if (source_event.settled && focused_event.settled) {
				settle();
			}
		}
	};

	_call(source_event.observe, source_event_observe =>
		_call(source_event_complete.observe, source_event_complete_observe => {
			// it must observe the source_event regardless of having any observers because it maintains state (focused_event) from source_event's value
			const unobserve_source_event = source_event_observe(source_event_observer);
			const unobserve_source_event_complete = source_event_complete_observe(source_event_complete_observer);

			registry.register(self, () => {
				unobserve_focused_event();
				unobserve_source_event();
				unobserve_source_event_complete();
			});
		})
	);

	return self
};

/*
	The switching event's complete event needs to be unsettled when the source event is unsettled,
	because the focused event is undetermined, so the focused event's complete event which the switching event's complete event depends on is undetermined.
*/
/*
	Like `calling`, the switch needs to unobserve its source event and focused event in post propagation when its complete event occurs.
*/
/*
	The complete event can be referenced while the switch event is no longer referenced
	but if the complete event is not referenced, then the switch event must also not be referenced, as the switch event has a reference to the complete event.
	That may mean that the switch event and its complete event should stop observing their dependencies when nothing references the complete event,
	but it seems safer and simpler to have the switch event unobserve its dependencies when nothing references it,
	and the complete event unobserve its depedencies when nothing references it.
	However, this could be problematic if they share a dependency on the source event,
	because if the switch event is no longer referenced, it could unobserve the source event,
	removing the observer that was being used for both the switch event and its complete event.
*/

// const switch_momentary = switch_updating
// 	(focused => focusing => focusing)
// 	(take_until (source_event) (initial_event))
// 	(map (take_until (source_event)) (source_event))

// TODO:
// export const switch_updating => resolve => initial => source =>

/*
	Because an observer will only unsettle and therefore unsettle its observers on its first pre_compute within a moment,
	switch calls pre_compute on its observers with `cycle_allowed` in both the focused event observer and the source event observer,
	in case the focused event observer pre_compute is called first and the source event observer pre_compute will be called afterward,
	having missed the chance to pre_compute observers with `cycle_allowed`.
*/

/*
	TODO: don't forget that this is low level and impure... it observes source_event upon creation and keeps internal state (focused_event) from source event's value.
*/
const create_switch = (resolve, initial_focused_event, source_event, source_event_complete) => {
	const observers = new Map();

	let resolve_event = null;
	let focused_event = initial_focused_event;
	let unobserve_focused_event = noop;

	let unsettling = false;
	let source_event_observes_this_event = false;

	const observe = observer => {
		const id = Symbol();
		observers.set(id, observer);

		if (observers.size === 1) {
			// it only needs to be observing the focused event when it is being observed
			// TODO: try to test and confirm that this doesn't cause some bug
			unobserve_focused_event = focused_event.observe(focused_event_observer);
		}

		// if (!source_event.settled || source_event.value !== nothing) {
		// 	observer.pre_compute(self, true)
		// }
		// if (!focused_event.settled || focused_event.value !== nothing) {
		// 	observer.pre_compute(self, true)
		// }
		if (!self.settled || self.value !== nothing) {
			observer.pre_compute(self, true);
		}
		if (self.value !== nothing) {
			observer.compute(self);
		}

		return () => {
			observers.delete(id);
			if (observers.size === (source_event_observes_this_event ? 1 : 0)) {
				unobserve_focused_event();
			}
		}
	};

	const self = {
		computed: null,
		occurred: null,
		observers,
		settled: true,
		value: nothing,
		observe
	};

	const maybe_settle = () => {
		const { post_propagation } = self.computed;
		const focus = resolve_event || focused_event;
		if (focus.settled) {
			self.settled = true;
			if (focus.value !== nothing) {
				self.occurred = self.computed;
				self.value = focus.value;
				post_propagation.add(() => self.value = nothing);
			}
			compute_observers(self);
		}
	};

	const focused_event_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			// TODO: instead of just checking focused_event.settled and source_event.settled, it might be best to set `will_compute_from_focused_event`, `will_compute_from_source_event`, will_compute_from_focusing_event, will_compute_from_resolve_event, or something to that effect. expecting_compute_from_source_event
			if (resolve_event) {
				return
			}

			self.computed = dependency.computed;

			// if (unsettling) {
			// 	if (cycle_allowed) {
			// 		throw new Error('switch focused_event_observer pre_compute cycle_allowed TODO:')
			// 	} else {
			// 		throw new Error_Cycle_Detected()
			// 	}
			// }

			if (self.settled) {
				self.settled = false;
				unsettling = true;
				pre_compute_observers(self, true);
				unsettling = false;
			}
		},
		compute: () => {
			/*
				When the source_event_observer is computed,
				the switched-to event is observed by the focused_event_observer.
				The switched-to event may already be settled, so this switched event (self) will settle.
				If this is occurring within the propagation to dependants of the focused event,
				then the focused event calls `compute` on the focused_event_observer after `self` has settled.
				This may only happen when the switch-on and switch-to events are the same: switch (() => x) (x)
			*/
			if (self.settled) {
				return
			}

			/*
				If the source_event has settled,
				then the focused event has been switched, // TODO: is this always true!?
				so this event can settle if the focused event and focusing event have settled
			*/
			if (source_event.settled || source_event_observes_this_event) {
				maybe_settle();
			}
		}
	};

	const source_event_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			if (resolve_event) {
				return
			}

			self.computed = dependency.computed;

			if (unsettling) {
				if (cycle_allowed) {
					source_event_observes_this_event = true;
					return
				} else {
					throw new Error_Cycle_Detected()
				}
			}

			source_event_observes_this_event = false;

			if (self.settled) {
				self.settled = false;
				unsettling = true;
				pre_compute_observers(self, true);
				unsettling = false;
			}
		},
		compute: () => {
			const { post_propagation } = self.computed;
			// TODO: checking resolve_event === null happened to get a test to pass, but it's such a state disaster and maybe there will be a new failing test at some point
			if (resolve_event === null && self.value !== nothing) {
				// own occurrence caused source event occurrence, so own occurrence is causing the focus change
				// `resolve_event` must be the focused event in this case, because this event (self) is already occurring with its value

				// TODO: refactor to share this with the other branch
				_call(source_event.value, focusing_event =>
					_call(resolve (focused_event) (focusing_event), _resolve_event => {
						if (_resolve_event !== focused_event) {
							// TODO: try to write a descriptive and accurate error message for this case... this one is probably off
							throw new Error_Cycle_Detected(`A switching event's occurrence caused its own input event's occurrence, which caused it to switch to an event that is occurring simultaneously.`)
						}
						unobserve_focused_event();
						post_propagation.add(() => {
							focused_event = focusing_event;
							unobserve_focused_event = focused_event.observe(focused_event_observer);
						});
					})
				);

				return
			}

			if (resolve_event) {
				return
			}

			if (source_event.value !== nothing) {
				_call(source_event.value, focusing_event =>
					// This is especially nasty - be sure to mutate `resolve_event` correctly - setting it to the value, NOT THE REFERENCE, or stuff like `resolve_event.settled` will be broken!
					_call(resolve (focused_event) (focusing_event), _resolve_event => {
							resolve_event = _resolve_event;
							const unobserve_resolve_event = resolve_event.observe(focused_event_observer);
							// if (self.value !== nothing && resolve_event !== focused_event) {
								// throw new Error_Cycle_Detected(`A switching event's occurrence caused its own input event's occurrence, which caused it to switch to an event that is occurring simultaneously.`)
							// }
							unobserve_focused_event();
							// TODO: try to move these to `maybe_settle` within the branch where self does settle and try to avoid post_propagation just to keep it simpler
							post_propagation.add(() => {
								focused_event = focusing_event;
								unobserve_focused_event = focused_event.observe(focused_event_observer);
								unobserve_resolve_event();
								resolve_event = null;
							});

							if (self.settled) {
								return
							}

							maybe_settle();
					})
				);
			} else {
				/*
					TODO: it may be posssible for the focused event observer compute to be called where the source event and focused event are settled,
					but the source event observer compute has not been called yet, which would switch the focus. If so, source event observer pre_compute could set a boolean so that
					the focused event observer compute can either be skipped so the focus is switched here, or so that it can switch the focus there before settling.
				*/
				if (self.settled) {
					return
				}

				/*
					At this time, the unfocused event could be settled, and/or the focused event could be settled, or neither are settled.
					If both are settled, this event can settle.
					Otherwise, either the unfocused event or focused event will propagate to this event's observer of them and this event can settle there.
				*/
				maybe_settle();
			}
		}
	};

	// it must observe the source_event regardless of having any observers because it maintains state (focused_event) from source_event's value
	// TODO: move this to _call below?
	_call(source_event.observe, source_event_observe =>
		// TODO: should the complete event logic take care of any of this instead?
		_call(source_event_complete.observe, source_event_complete_observe => {
			const unobserve_source_event = source_event_observe(source_event_observer);
			let instant;
			const unobserve_source_event_complete = source_event_complete_observe({
				pre_compute: dependency => {
					instant = dependency.computed;
				},
				compute: () => {
					// TODO: maybe all references need to be updated from stuff like focused_event.complete to focused_event_complete
					if (source_event_complete.value !== nothing) {
						instant.post_propagation.add(() => {
							unobserve_source_event();
							unobserve_source_event_complete();
							if (focused_event.complete.occurred !== null) {
								unobserve_focused_event();
							}
						});
					}
				}
			});

			registry.register(self, () => {
				unobserve_source_event();
				unobserve_source_event_complete();
			});
		})
	);

	return self
};

/*
	TODO: document the rules and semantics regarding side effects, referential transparency, determinism.
	Side effects can only be performed from Events via Actions by `performing` (or functions by `calling`)
	but the function passed to map doesn't have to be referentially transparent or deterministic.
	It's a sketchy impure situation, but Event is impure, so it seems ok.
	Otherwise, expressions like `map (() => some_other_event) (some_event)` will be prohibited,
	so there would need to be a solid alternative way of doing that, presumably involving Dynamic/Sample.
	If so, perhaps the implementation could be simplified.
*/
const _switch_updating = (resolve, initial_focused_event, source_event, source_event_complete) => {
	const self = create_switch (
		resolve,
		initial_focused_event,
		source_event,
		source_event_complete
	);
	self.complete = create_switch_complete(initial_focused_event, source_event, source_event_complete);
	return self
};

const switch_updating = resolve => initial_focused_event => source_event =>
	_use(initial_focused_event, initial_focused_event =>
		_use(source_event, source_event =>
			_use(source_event.complete, source_event_complete =>
				_switch_updating(resolve, initial_focused_event, source_event, source_event_complete)
			)
		)
	);

export { create_switch, switch_updating };
