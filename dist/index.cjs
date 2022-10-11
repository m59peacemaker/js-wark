'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const construct$2 = f => ({ run: f });

const apply = xf => xv =>
	construct$2 (
		instant =>
			xf.run(instant) (xv.run(instant))
	);

const join$1 = action =>
	construct$2 (
		instant =>
			action.run(instant).run(instant)
	);

const map$3 = f => action =>
	construct$2 (
		instant =>
			f (action.run(instant))
	);

const chain$2 = f => x =>
	join$1 (
		map$3 (f) (x)
	);

const from_function = f => construct$2(() => f());

const lift2$1 = f => x1 => x2 =>
	construct$2 (
		instant =>
			f
				(x1.run(instant))
				(x2.run(instant))
	);

const lift3 = f => x1 => x2 => x3 =>
	construct$2 (
		instant =>
			f
				(x1.run(instant))
				(x2.run(instant))
				(x3.run(instant))
	);

const of$4 = x => construct$2 (() => x);

// TODO: rename/refactor all the instant/time/propagation stuff
const create_instant = () => ({ post_propagation: new Set() });

const run_post_instant = instant => {
	for (const f of instant.post_propagation) {
		f();
	}
	/*
		TODO: possible implementation of some Task and/or Event function(s) where the Event occurs in the subsequent instant.
		Task.something (value), Action Event where the Event occurs with the given value in the instant after the Action runs
			Event.something (x_event) Event occurs the instant after x_event occurs (Event.afterward?)
		That is possibly implemented as `Event.switching (Event.performing (Task.something))` or `Event.perform_switching (Task.something)` ?
		Then again, maybe some Task function would be implemented from Event.something instead.
	*/
	// if (instant.next.size) {
	// 	run_instant (
	// 		create_instant(),
	// 		instant => {
	// 			for (const f of instant.next) {
	// 				f(instant)
	// 			}
	// 		}
	// 	)
	// }
};

const run = action => {
	const instant = create_instant();
	const result = action.run(instant);
	run_post_instant(instant);
	return result
};

var index$5 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	construct: construct$2,
	apply: apply,
	chain: chain$2,
	from_function: from_function,
	join: join$1,
	lift2: lift2$1,
	lift3: lift3,
	map: map$3,
	of: of$4,
	run: run
});

// TODO: consider changing this to "not_occurring" or something like that, for better distinction from a public api 'nothing' (if that ends up being a thing)
const nothing$1 = Symbol('nothing');

const catch_up_observer = (event, observer, cycle_allowed) => {
	if (!event.settled || event.value !== nothing$1) {
		observer.pre_compute(event, cycle_allowed);
	}
	if (event.value !== nothing$1) {
		observer.compute(event);
	}
};

const pre_compute_observers = (event, cycle_allowed) => {
	for (const observer of event.observers.values()) {
		observer.pre_compute(event, cycle_allowed);
	}
};

const compute_observers = event => {
	for (const observer of event.observers.values()) {
		observer.compute(event);
	}
};

const uninitialized$1 = Symbol('uninitialized');

class Reference {
	constructor (f) {
		this._value = uninitialized$1;
		this._dependants = new Set();
		this._queue = [];
		f(
			x => {
				if (x instanceof Reference) {
					if (this.has_dependant(x)) {
						let value = uninitialized$1;
						const tmp = new Proxy({}, {
							get (_, prop) {
								if (value !== uninitialized$1) {
									return value[prop]
								}
								return new Reference ((assign, reference) =>
									// TODO: `null` didn't work... maybe the following comment was wrong. This needs more thought.
									// since it depends on itself, pass null dependant here to break the cycle
									x.get(reference, x => assign(x[prop]))
								)
							}
						});
						this._set(tmp);
						x.get(null, x => value = x);
					} else {
						// TODO: is `null` ok here?
						x.get(null, this._set.bind(this));
					}
				} else {
					this._set(x);
				}
				return x
			},
			this
		);
	}
	_set (x) {
		this._value = x;
		while (this._queue.length > 0) {
			this._queue.pop()(x);
		}
	}
	get (dependant, f) {
		if (this._value === uninitialized$1) {
			if (dependant) {
				this._dependants.add(dependant);
			}
			this._queue.push(f);
		} else {
			f(this._value);
		}
	}
	has_dependant (x) {
		if (this._dependants.has(x)) {
			return true
		}
		for (const dependant of this._dependants) {
			if (dependant.has_dependant(x)) {
				return true
			}
		}
		return false
	}
}

const get$1 = (dependant, x, f) => {
	if (x instanceof Reference) {
		x.get(dependant, f);
	} else {
		f (x);
	}
};

const _call = (x, f) => get$1(null, x, f);

const call = f => x => _call (x, f);

const construct$1 = f => new Reference(f);

// slightly more efficient than `use (f) (x)`
const _use = (x, f) => {
	if (x instanceof Reference) {
		return construct$1 ((assign, reference) => x.get(reference, x => assign (f (x))))
	} else {
		return f (x)
	}
};

const use = f => x => _use (x, f);

const _calling$1 = (f, input_event, input_event_complete) => {
	const observers = new Map();
	let unobserve_input_event;

	const self = {
		computed: null,
		occurred: null,
		complete: input_event_complete,
		observers,
		settled: true,
		value: nothing$1,
		observe: observer => {
			const id = Symbol();

			catch_up_observer(self, observer, false);

			observers.set(id, observer);
			return () => observers.delete(id)
		}
	};

	_use(
		input_event.observe,
		input_event_observe => {
			unobserve_input_event = input_event_observe({
				pre_compute: (dependency, cycle_allowed) => {
					self.computed = dependency.computed;
					self.settled = false;
					pre_compute_observers(self, cycle_allowed);
				},
				compute: () => {
					const { post_propagation } = self.computed;
					if (self.settled) {
						return
					}
					self.settled = true;
					if (input_event.value !== nothing$1) {
						self.occurred = self.computed;
						self.value = f (input_event.value);
						post_propagation.add(() => self.value = nothing$1);
					}
					compute_observers(self);
				}
			});
		}
	);

	/*
		This is the essence of the implementation of `complete_when`.
		The `complete` property of an event may actually be an event that occurs many times,
		but only one occurrence of a complete event is observed,
		making it effectively true that the complete event only occurs once.
	*/
	_call(input_event_complete.observe, input_event_complete_observe => {
		let instant;
		const unobserve_input_event_complete_event = input_event_complete_observe({
			pre_compute: dependency => {
				instant = dependency.computed;
			},
			compute: () => {
				if (input_event_complete.value !== nothing$1) {
					instant.post_propagation.add(() => {
						unobserve_input_event();
						unobserve_input_event_complete_event();
					});
				}
			}
		});
	});

	return self
};

const calling$2 = f => input_event =>
	_use(input_event, input_event =>
		_use(input_event.complete, input_event_complete =>
			_calling$1 (f, input_event, input_event_complete)
		)
	);

const _calling = (f, dynamic, dynamic_updates, dynamic_updates_complete) => {
	const updates = _calling$1 (f, dynamic_updates, dynamic_updates_complete);

	let value = f (dynamic.run());

	const unobserve = updates.observe({
		pre_compute: () => {},
		compute: () => {
			if (updates.value !== nothing$1) {
				value = updates.value;
			}
		}
	});

	const unobserve_complete = dynamic_updates_complete.observe({
		pre_compute: () => {},
		compute: dependency => {
			if (dependency.value !== nothing$1) {
				dependency.propagation.post_propagation.add(() => {
					unobserve();
					unobserve_complete();
				});
			}
		}
	});

	return {
		value,
		updates
	}
};

const calling$1 = f => dynamic =>
	_use(dynamic, dynamic =>
		_use(dynamic.updates, dynamic_updates =>
			_use(dynamic_updates.complete, dynamic_updates_complete =>
				_calling (f, dynamic, dynamic_updates, dynamic_updates_complete)
			)
		)
	);

const _map$1 = (f, input_event) => {
	const observers = new Map();

	let unobserve_input_event;

	const self = {
		computed: null,
		occurred: null,
		complete: input_event.complete,
		observers,
		settled: true,
		value: nothing$1,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);
			if (observers.size === 1) {
				_call (input_event.observe, input_event_observe =>
					unobserve_input_event = input_event_observe(input_event_observer)
				);
			}

			catch_up_observer (self, observer, false);

			return () => {
				observers.delete(id);
				if (observers.size === 0) {
					unobserve_input_event();
				}
			}
		}
	};

	const input_event_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			self.computed = dependency.computed;
			self.settled = false;
			pre_compute_observers(self, cycle_allowed);
		},
		compute: () => {
			const { post_propagation } = self.computed;
			self.settled = true;
			if (input_event.value !== nothing$1) {
				self.occurred = self.computed;
				self.value = f (input_event.value);
				post_propagation.add(() => self.value = nothing$1);
			}
			compute_observers(self);
		}
	};

	return self
};

const map$2 = f => input_event =>
	_use(input_event, input_event =>
		_map$1 (f, input_event)
	);

const nothing = Symbol();

const identity = x => x;

const noop = () => {};

const pipe2 = (f, g) => x => g(f(x));

const update = index => value => array => {
	const x = [];
	for (let i = 0; i < array.length; ++i) {
		x[i] = i === index ? value : array[i];
	}
	return x
};

class Error_Cycle_Detected extends Error {
  constructor (message) {
    super(`Event's occurrence depends on its own occurrence.${message ? ` ${message}` : ''}`);
  }
}

const is_same_event_reference = (a, b) => (a.referenced || a) === (b.referenced || b);

const initial_instant = create_instant();

const completed = (x => {
	x.complete = x;
	return x
})({
	computed: initial_instant,
	occurred: initial_instant,
	observe: () => noop,
	settled: true,
	value: nothing$1
});

const never = {
	computed: null,
	occurred: null,
	complete: completed,
	observe: () => noop,
	settled: true,
	value: nothing$1
};

// TODO: this shares a ton of code with create_merged_event
// TODO: does the complete event need the "*_observes_this_event"/cycle logic? If so, write tests for that. If not, remove that logic.
const create_merged_complete_event = (a, b) => {
	const observers = new Map();

	let unobserve_a;
	let unobserve_b;

	let unsettling = false;

	let a_observes_this_event = false;
	let b_observes_this_event = false;

	const self = {
		computed: null,
		occurred: null,
		observers,
		settled: true,
		value: nothing$1,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);

			if (observers.size === 1) {
				_call(a.observe, a_observe =>
					_call(b.observe, b_observe => {
						unobserve_a = a_observe(dependency_observer);
						unobserve_b = b_observe(dependency_observer);
					})
				);
			}

			catch_up_observer (self, observer, false);

			return () => {
				observers.delete(id);
				if (observers.size === 0) {
					unobserve_a();
					unobserve_b();
				}
			}
		}
	};

	/*
		TODO: it might cleaner and/or more performant to make an observer for `a` and an observer for `b`,
		rather than sharing an observer and distinguishing the dependency via the input argument.
	*/
	const dependency_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			self.computed = dependency.computed;

			if (unsettling) {
				if (cycle_allowed) {
					if (is_same_event_reference (a, dependency)) {
						a_observes_this_event = true;
					} else {
						b_observes_this_event = true;
					}
					return
				} else {
					throw new Error_Cycle_Detected()
				}
			}

			if (self.settled) {
				self.settled = false;
				unsettling = true;
				pre_compute_observers(self, cycle_allowed);
				unsettling = false;
			}
		},
		compute: () => {
			const { post_propagation } = self.computed;

			/*
				if both dependencies are simultaneous,
				then the computation from the first dependency settles this event,
				so the second computation does nothing.
			*/
			if (self.settled) {
				return
			}

			if ((a.settled || a_observes_this_event) && (b.settled || b_observes_this_event)) {
				self.settled = true;
				if (a.value !== nothing$1 || b.value !== nothing$1) {
					const value = a.occurred && b.occurred
						? a.value === nothing$1 ? b.value : a.value
						: nothing;
					if (value !== nothing) {
						self.occurred = self.computed;
						self.value = value;
						post_propagation.add(() => self.value = nothing$1);
					}
				}
				compute_observers(self);
			}
		}
	};

	return self
};

const create_merged_event = (f, a, b, a_complete, b_complete) => {
	const observers = new Map();

	let unobserve_a;
	let unobserve_a_complete;
	let unobserve_b;
	let unobserve_b_complete;

	let unsettling = false;

	let a_observes_this_event = false;
	let b_observes_this_event = false;

	let a_is_complete = false;
	let b_is_complete = false;

	const self = {
		computed: null,
		occurred: null,
		observers,
		settled: true,
		value: nothing$1,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);

			if (observers.size === 1) {
				// TODO: use `call` rather than `use` ?
				_call(a.observe, a_observe =>
					_call(a_complete.observe, a_complete_observe =>
						_call(b.observe, b_observe =>
							_call(b_complete.observe, b_complete_observe => {
								unobserve_a = a_observe(dependency_observer);
								unobserve_b = b_observe(dependency_observer);
								unobserve_a_complete = a_complete_observe(dependency_complete_observer);
								unobserve_b_complete = b_complete_observe(dependency_complete_observer);
							})
						)
					)
				);
			}

			catch_up_observer (self, observer, false);

			return () => {
				observers.delete(id);
				if (observers.size === 0) {
					unobserve_a();
					unobserve_b();
					unobserve_a_complete();
					unobserve_b_complete();
				}
			}
		}
	};

	/*
		TODO: it might cleaner and/or more performant to make an observer for `a` and an observer for `b`,
		rather than sharing an observer and distinguishing the dependency via the input argument.
	*/
	const dependency_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			self.computed = dependency.computed;

			if (unsettling) {
				if (cycle_allowed) {
					if (is_same_event_reference (a, dependency)) {
						a_observes_this_event = true;
					} else {
						b_observes_this_event = true;
					}
					return
				} else {
					throw new Error_Cycle_Detected()
				}
			}

			if (self.settled) {
				self.settled = false;
				unsettling = true;
				pre_compute_observers(self, cycle_allowed);
				unsettling = false;
			}
		},
		compute: () => {
			const { post_propagation } = self.computed;

			/*
				if both dependencies are simultaneous,
				then the computation from the first dependency settles this event,
				so the second computation does nothing.
			*/
			if (self.settled) {
				return
			}

			if ((a.settled || a_observes_this_event) && (b.settled || b_observes_this_event)) {
				self.settled = true;
				if (a.value !== nothing$1 || b.value !== nothing$1) {
					const value = f (a_is_complete ? never : a, b_is_complete ? never : b);
					if (value !== nothing) {
						self.occurred = self.computed;
						self.value = value;
						post_propagation.add(() => self.value = nothing$1);
					}
				}
				compute_observers(self);
			}
		}
	};

	let complete_computed;
	const dependency_complete_observer = {
		pre_compute: dependency => {
			complete_computed = dependency.computed;
		},
		compute: dependency => {
			if (a_complete.value !== nothing$1 && is_same_event_reference(a_complete, dependency)) {
				complete_computed.post_propagation.add(() => {
					a_is_complete = true;
					unobserve_a();
					unobserve_a_complete();
				});
			}
			if (b_complete.value !== nothing$1 && is_same_event_reference(b_complete, dependency)) {
				complete_computed.post_propagation.add(() => {
					b_is_complete = true;
					unobserve_b();
					unobserve_b_complete();
				});
			}
		}
	};

	return self
};

const _merge_2_with = (f, a, b, a_complete, b_complete) => {
	const merge_f = (a, b) => f
		(a.value === nothing$1 ? nothing : a.value)
		(b.value === nothing$1 ? nothing : b.value);
	const self = create_merged_event (merge_f, a, b, a_complete, b_complete);
	const complete = create_merged_complete_event (a_complete, b_complete);
	complete.complete = complete;
	self.complete = complete;
	return self
};

const merge_2_with = f => a => b =>
	_use(a, a =>
		_use(a.complete, a_complete =>
			_use(b, b =>
				_use(b.complete, b_complete =>
					_merge_2_with (f, a, b, a_complete, b_complete)
				)
			)
		)
	);

const registry$6 = new FinalizationRegistry(unobserve => unobserve());

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
		if (!source_event.settled || source_event.value !== nothing$1) {
			observer.pre_compute(self, false);
		}
		if (!focused_event.settled || focused_event.value !== nothing$1) {
			observer.pre_compute(self, false);
		}
		if (self.value !== nothing$1) {
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
		value: nothing$1,
		observe
	};
	self.complete = self;

	const settle = () => {
		const { post_propagation } = self.computed;
		self.settled = true;
		if (source_event.complete.occurred !== null && focused_event.occurred !== null) {
			self.occurred = self.computed;
			self.value = source_event.complete.value === nothing$1 ? focused_event.value : source_event.complete.value;
			post_propagation.add(() => self.value = nothing$1);
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
			if (source_event.value !== nothing$1) {
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

			registry$6.register(self, () => {
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
		if (!self.settled || self.value !== nothing$1) {
			observer.pre_compute(self, true);
		}
		if (self.value !== nothing$1) {
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
		value: nothing$1,
		observe
	};

	const maybe_settle = () => {
		const { post_propagation } = self.computed;
		const focus = resolve_event || focused_event;
		if (focus.settled) {
			self.settled = true;
			if (focus.value !== nothing$1) {
				self.occurred = self.computed;
				self.value = focus.value;
				post_propagation.add(() => self.value = nothing$1);
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
			if (resolve_event === null && self.value !== nothing$1) {
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

			if (source_event.value !== nothing$1) {
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
					if (source_event_complete.value !== nothing$1) {
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

			registry$6.register(self, () => {
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

const immediately = _ => y => y;

const updates = dynamic =>
	_use(dynamic, dynamic => dynamic.updates);

/*
	TODO: A possible efficiency gain is to pass the same reference to each `get` call,
	but only if it works in all cases.
*/
// export const use2 = f => a => b => {
// 	const reference = create()
// 	get (reference, a, a => get (reference, b, b => reference.assign (f (a) (b))))
// 	return reference
// }
// export const use3 = f => a => b => c => {
// 	const reference = create()
// 	a.get(reference, a => b.get(reference, b => c.get(reference, c => reference.assign(f (a) (b) (c)))))
// 	return reference
// }

const use2 = f => a => b =>
	_use (a, a =>
		_use (b, b =>
			f (a) (b)
		)
	);

const array = use
		(array =>
			array.reduce(
				(acc, x) => use2 (acc => x => [ ...acc, x ]) (acc) (x),
				[]
			)
		);

const create$1 = () => {
	let assign;
	const reference = construct$1(x => {
		assign = x;
	});
	reference.assign = assign;
	return reference
};

const forward_referencing = f =>
	construct$1((assign, reference) => assign(f(reference)));

const object = use
	(object => {
		const keys = Object.keys(object);
		return use
			(array =>
				keys
					.reduce(
						(acc, key, index) => {
							acc[key] = array[index];
							return acc
						},
						{}
					)
			)
			(array (Object.values (object)))
	});

const of$3 = value => construct$1 (assign => assign(value));

const use3 = f => a => b => c =>
	_use (a, a =>
		_use (b, b =>
			_use (c, c =>
				f (a) (b) (c)
			)
		)
	);

var index$4 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	array: array,
	_call: _call,
	call: call,
	create: create$1,
	construct: construct$1,
	forward_referencing: forward_referencing,
	get: get$1,
	object: object,
	of: of$3,
	Reference: Reference,
	_use: _use,
	use: use,
	use2: use2,
	use3: use3
});

const uninitialized = Symbol();

// TODO: most of this can be a function of Reference, for returning the value of an already assigned reference
const get = dynamic => {
	let value = uninitialized;
	call
		(x => value = x)
		(dynamic);
	if (value === uninitialized) {
		// TODO: custom error?
		throw new Error('Dynamic.get() was called on a reference before it was assigned a value.')
	}
	return value.run(Symbol())
};

const registry$5 = new FinalizationRegistry(unobserve => unobserve());

const _join = (dynamic, initial_inner_dynamic) => {
	let value = initial_inner_dynamic.run();

	/*
		TODO: merging adds a lot of work just to get the joined update event to occur at the time the input dynamic update event occurs
		and the switch implementation is probably already doing the same heavy lifting, almost as though the occurrence we need is right there,
		and it just doesn't consider it.
		A lower level function could be made from which this `updates` event for `join` could be derived, and Event's switch could also be derived.
		It would be especially wild if that function could also derive merging (at least for fun).
		But keep in mind it would be ideal to generate implementation code at build time for maximum efficiency and byte vs performance options.
		`switch_updating` may already be this function, except it's not clear how to present the resolve function so all this can be expressed.
		const get_event_value = event => event.value
		const event_is_occurring = event => get_value (event) !== public_nothing
		Example:
			switch_updating
				(x => y =>
					event_is_occurring (updates (dynamic))
						? calling (get_dynamic_value) (updates (dynamic))
						: y
				)
	*/
	// TODO: this should be able to use _merge_2_with, _switch_updating, and _map for efficiency.
	const updates$1 = merge_2_with
		(a => b => b === nothing ? a : get(b))
		(switch_updating
			(immediately)
			(initial_inner_dynamic.updates)
			(map$2
				(updates)
				(dynamic.updates)
			)
		)
		(dynamic.updates);

	// TODO: this use Sample.join instead, and not observe its own updates. This should currently be bugged by updating to the new value in the same instant the update event occurs (this is the old behavior)
	const self = {
		run: () => value,
		updates: updates$1,
	};

	const unobserve = updates$1.observe({
		pre_compute: () => {},
		compute: () => {
			if (updates$1.value !== nothing$1) {
				value = updates$1.value;
			}
		}
	});
	
	registry$5.register(self, unobserve);

	return self
};

const join = dynamic =>
	_use(dynamic, dynamic => {
		return _use(dynamic.run(), initial_inner_dynamic =>
			_join(dynamic, initial_inner_dynamic)
		)
	});

const construct = f => {
	let cache_instant = Symbol();
	let cache_value = null;
	return {
		run: instant => {
			if (instant !== cache_instant) {
				cache_instant = instant;
				cache_value = f (instant);
			}
			return cache_value
		}
	}
};

const map$1 = f => x =>
	construct (
		instant =>
			f (x.run(instant))
	);

// import { chain } from './chain.js'
// import { nothing } from '../Event/internal/nothing.js'

// const registry = new FinalizationRegistry(unobserve => unobserve())
// export const _map = (f, dynamic) => {
// 	let value = f (dynamic.run())
	
// 	const updates = Event_map(f, dynamic.updates)

// 	const self = {
// 		run: () => value,
// 		updates
// 	}

// 	const unobserve = updates.observe({
// 		pre_compute: () => {},
// 		compute: () => {
// 			if (updates.value !== nothing) {
// 				value = updates.value
// 			}
// 		}
// 	})
	
// 	registry.register(self, unobserve)

// 	return self
// }

const _map = (f, dynamic) => {
	const self = map$1 (f) (dynamic);
	self.updates = _map$1(f, dynamic.updates);
	return self
};

const map = f => dynamic =>
	_use(dynamic, dynamic => _map (f, dynamic));

const chain$1 = f => x => join (map (f) (x));
/*
Event.switch_updating
resolve => initial => source
f       => Event   => Event Event

Dynamic.switching
source =>
Dynamic Event => Event
Dynamic.switching = Event.switch_updating (immediately) (source.run()) (source)

Event.switching
source =>
Event Event => Event
Event.switching = Event.switch_updating (immediately) (never) (source)
*/

// import { map } from '../Event/map.js'
// import { merge_2_with } from '../Event/merge_2_with.js'
// import { nothing as public_nothing } from '../Event/nothing.js'
// import { nothing } from '../Event/internal/nothing.js'
// import { switch_updating } from '../Event/switch_updating.js'
// import { _use } from '../Reference/use.js'
// import { immediately } from '../immediately.js'

// const registry = new FinalizationRegistry(unobserve => unobserve())

// // TODO: use underscore version of functions e.g. _map
// export const _chain = (f, dynamic) => {
// 	const initial_inner_dynamic = f (dynamic.run())
// 	let value = initial_inner_dynamic.run()

// 	const inner_dynamics = map (f) (dynamic.updates)

// 	const updates = merge_2_with
// 		(a => b => b === public_nothing ? a : b.run())
// 		(switch_updating
// 			(immediately)
// 			(initial_inner_dynamic.updates)
// 			(map
// 				(x => x.updates)
// 				(inner_dynamics)
// 			)
// 		)
// 		(inner_dynamics)

// 	const self = {
// 		run: () => value,
// 		updates,
// 	}

// 	const unobserve = updates.observe({
// 		pre_compute: () => {},
// 		compute: () => {
// 			if (updates.value !== nothing) {
// 				value = updates.value
// 			}
// 		}
// 	})
	
// 	registry.register(self, unobserve)

// 	return self
// }

// export const chain = f => dynamic =>
// 	_use(dynamic, dynamic => _chain (f, dynamic))

const registry$4 = new FinalizationRegistry(unobserve => unobserve());

const _hold = (initial_value, event, event_complete) => {
	let value = initial_value;

	const self = {
		run: () => value,
		updates: event
	};

	_call(event.observe, event_observe => {
		_call(event_complete.observe, event_complete_observe => {
			const unobserve = event_observe({
				pre_compute: () => {},
				compute: () => {
					if (event.value !== nothing$1) {
						const update_value = event.value;
						event.computed.post_propagation.add(() => {
							// NOTE: you cannot check `event.value` here, as it will already be set back to `nothing`.
							value = update_value;
						});
					}
				}
			});
			/*
				NOTE: In the implementation, whether an Event is complete can be checked by `event.complete.occurred !== null`.
				Statefully observing an event requires also observing its complete event,
				so that the complete event's occurrence time property is updated when it should occur.
			*/
			const unobserve_complete = event_complete_observe({
				pre_compute: noop,
				compute: () => {
					if (event_complete.value !== nothing$1) {
						// TODO: this breaks garbage collection because it references `self`... so does this need to be done differently or is it unnecessary?
						// registry.unregister(self)
						unobserve();
						unobserve_complete();
					}
				}
			});

			registry$4.register(self, () => {
				unobserve();
				unobserve_complete();
			});
		});
	});

	return self
};

const hold = initial_value => event =>
	_use (event, event =>
		_use (event.complete, event_complete =>
			_hold(initial_value, event, event_complete)
		)
	);

const produce = (event, value) => {
	const instant = create_instant();
	event.computed = instant;
	event.occurred = instant;
	event.value = value;
	pre_compute_observers(event, false);
	compute_observers(event);
	event.value = nothing$1;
	run_post_instant(instant);
};

const producer = producer_function => {
	const observers = new Map();

	const self = {
		computed: null,
		occurred: null,
		complete: never,
		observers,
		settled: true,
		value: nothing$1,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);

			catch_up_observer (self, observer);

			return () => {
				observers.delete(id);
			}
		}
	};

	producer_function (x => produce(self, x));

	return self
};

const exposed_producer = () => {
	let produce;
	const x = producer(x => produce = x);
	x.produce = produce;
	return x
};

const create = initial_value => hold (initial_value) (exposed_producer());

const of$2 = value => ({ run: () => value, updates: never });

// TODO: THIS IS WRONG! Using `get` here will needlessly cause the dynamic and its upstream dynamics to recompute (or worse, upstream plain samples, if that's a thing somehow)
const switching$1 = dynamic => switch_updating (immediately) (get (dynamic)) (updates (dynamic));

var index$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	calling: calling$1,
	chain: chain$1,
	create: create,
	get: get,
	_join: _join,
	join: join,
	_map: _map,
	map: map,
	of: of$2,
	switching: switching$1,
	updates: updates
});

const alt = merge_2_with (a => b => a === nothing ? b : a);

const complete = event => _use(event, event => event.complete);

const _snapshot = (f, sample, input_event) => {
	const observers = new Map();

	let unobserve_input_event;

	const self = {
		computed: null,
		occurred: null,
		complete: input_event.complete,
		observers,
		settled: true,
		value: nothing$1,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);
			if (observers.size === 1) {
				_use(input_event.observe, input_event_observe => {
					unobserve_input_event = input_event_observe(input_event_observer);
				});
			}

			catch_up_observer (self, observer, false);

			return () => {
				observers.delete(id);
				if (observers.size === 0) {
					unobserve_input_event();
				}
			}
		}
	};

	const input_event_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			self.computed = dependency.computed;
			self.settled = false;
			pre_compute_observers(self, cycle_allowed);
		},
		compute: () => {
			const { post_propagation } = self.computed;
			self.settled = true;
			if (input_event.value !== nothing$1) {
				self.occurred = self.computed;
				self.value = f (sample.run(self.computed)) (input_event.value);
				post_propagation.add(() => self.value = nothing$1);
			}
			compute_observers(self);
		}
	};

	return self
};

const snapshot = f => sample => input_event =>
	_use(sample, sample =>
		_use(input_event, input_event =>
			_snapshot (f, sample, input_event)
		)
	);

const scan = f => initial_value => event =>
	forward_referencing (x =>
		hold
			(initial_value)
			(snapshot (f) (x) (event))
	);

const incrementing = x => _ => x + 1;

const count = scan (incrementing) (0);

const switching = switch_updating (immediately) (never);

/*
	Event X => Event Y => Event Y
	Takes an Event, `a`, and an Event, `b`, and returns an Event with the same occurrences as Event `b` until Event `a` occurs, and completes when Event `a` occurs.
*/

/*
	The complete event of the returned event is nearly the same as the input complete_event,
	except it needs its complete event to be itself,
	and it needs to occur only once.
	The input complete event may occur many times,
	but it isn't necessary to derive a new event for this purpose.
	Instead, `performing` observes the complete event of its input event
	and unobserves the input event and its complete event when the complete event occurs.
*/
/*
	From a high level perspective, `take_until` returns an Event with a Dynamic `is_complete` that updates to `true` when `complete_event` occurs.
	`take_until` must therefore observe the complete_event so that it can be known whether it has occurred even though it may not have any other observers.
*/

const registry$3 = new FinalizationRegistry(unobserve => unobserve());

/*
	TODO: perhaps rename this to `complete_when` and make `take_until = x => y => complete_when (alt (x) (complete (y)))`
	Otherwise, there is an inconsistency with `take (n) (x)`, if it completes on the nth occurrence OR when `x` completes
*/
/*
	TODO: maybe use a Proxy to clean this up
*/
/*
	TODO: try to get rid of the `referenced` property
*/
const _take_until = (complete_event, input_event) => {
	const complete = {
		get computed () { return complete_event.computed },
		get occurred () { return complete_event.occurred },
		get observers () { return complete_event.observers },
		get settled () { return complete_event.settled },
		get value () { return complete_event.value },
		get observe () { return complete_event.observe },
		get referenced () { return complete_event }
	};
	complete.complete = complete;
	const unobserve = complete_event.observe({
		pre_compute: noop,
		compute: () => {
			if (complete_event.value !== nothing$1) {
				// TODO: this breaks garbage collection because it references `self`... so does this need to be done differently or is it unnecessary?
				// registry.unregister(complete)
				unobserve();
			}
		}
	});
	registry$3.register(complete, unobserve);
	return {
		complete,
		get computed () { return input_event.computed },
		get occurred () { return input_event.occurred },
		get observers () { return input_event.observers },
		get settled () { return input_event.settled },
		get value () { return input_event.value },
		get observe () { return input_event.observe },
		get referenced () { return input_event }
	}
};

const take_until = complete_event => input_event =>
	_use(complete_event, complete_event =>
		_use(input_event, input_event =>
			_take_until(complete_event, input_event)
		)
	);

const once$1 = x => take_until (x) (x);

const registry$2 = new FinalizationRegistry(cleanup => cleanup());

// TODO: maybe rename to weak_producer. contingent_producer sounds like something that would take a reference to something and be eligible for garbage collection when that reference is eligible for garbage collection.
const contingent_producer = producer_function => {
	const self = {
		computed: null,
		occurred: null,
		complete: never,
		observers: new Map(),
		settled: true,
		value: nothing$1,
		observe: observer => {
			const self = ref.deref();
			if (!self) { return }
			const id = Symbol();
			self.observers.set(id, observer);

			catch_up_observer (self, observer);

			return () => {
				const self = ref.deref();
				if (!self) { return }
				self.observers.delete(id);
			}
		}
	};

	const ref = new WeakRef(self);
	
	registry$2.register(self, producer_function (x => {
		const self = ref.deref();
		if (!self) { return }
		return produce(self, x)
	}));

	return self
};

const wait = ({ ms, value }) =>
	once$1 (
		contingent_producer (produce => {
			const timeout = setTimeout (() => produce (value), ms);
			timeout.unref && timeout.unref();
			return () => clearTimeout (timeout)
		})
	);

const delay = ({ ms }) => pipe2(
	map$2 (value => wait ({ ms, value })),
	switching
);

// TODO: efficient filter implementation (see map.js)

const filter = f => event =>
	switching
		(map$2
			(x => f (x) ? event : never)
			(event)
		);

const from_promise = promise =>
	once$1 (
		producer (produce => promise.then(produce).catch(produce))
	);

const registry$1 = new FinalizationRegistry(cleanup => cleanup());

const _is_complete = event => {
	const updates = map$2
		(() => true)
		(event.complete);

	let value = event.complete.occurred !== null;

	const self = {
		run: () => value,
		updates
	};

	if (!value) {
		const unobserve = event.complete.observe({
			pre_compute: () => {},
			compute: () => {
				if (event.complete.value !== nothing$1) {
					event.complete.computed.post_propagation.add(() => {
						value = true;
					});
				}
			}
		});

		registry$1.register(self, unobserve);
	}

	return self
};

// TODO: resolve event.complete here as well?
const is_complete = event =>
	_use(event, _is_complete);

// TODO: implement efficient merge for many events rather than implementing this from merge_2_with
const merge_array = events => {
	const nothings = events.map(() => nothing);
	return events
		.slice(1)
		.reduce(
			(acc, x, i) =>
				merge_2_with
					(a => b => update (i + 1) (b) (a === nothing ? nothings : a))
					(acc)
					(x)
			,
			map$2
				(x => [ x, ...nothings.slice(1) ])
				(events[0])
		)
};

/*
	`on_demand_producer` calls its `producer_function` only when it gains an observer from having no observers.
	It calls the cleanup function returned by its `producer_function` when an observer stop observing and there are no remaining observers.
	Only stateful observers observe their dependencies when they are not being observed, so only a stateful observer would cause this producer to call its `producer_function`.
*/
const on_demand_producer = producer_function => {
	const observers = new Map();
	let deactivate;

	const self = {
		computed: null,
		occurred: null,
		complete: never,
		observers,
		settled: true,
		value: nothing$1,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);

			if (observers.size === 1) {
				deactivate = producer_function (self_produce);
			}

			// TODO: should this be wrapped in `else { }` ?
			catch_up_observer (self, observer);

			return () => {
				observers.delete(id);
				if (observers.size === 0) {
					deactivate();
				}
			}
		}
	};

	const self_produce = x => produce(self, x);

	return self
};

const performing = f => event =>
	calling$2
		(x => f (x).run (event.computed))
		(event);

const performed = performing (identity);

const tag = snapshot (x => y => x);

const gate = sample => event =>
	filter
		(identity)
		(tag
			(sample)
			(event)
		);

/*
	TODO: get opinions about this
		If the Dynamic's value is already `true`, the returned Event should be `never`.
		But checking the value is supposed to be Sample, a type of Action, so `Sample.run(dynamic)` is required in order to get that value.
		Is that problematic here?
		If there are any side effects of the run() call, they will be triggered here...
		Though, that is implied by the operator, and it is on the impure Event anyway, and it does have the Sample cache, so it's only going to happen once for this moment,
		so maybe it's coherent.
*/

/*
	Dynamic Boolean => Event X => Event X
	Takes a Dynamic Boolean, `a`, and an Event, `b`, and returns an Event with the same occurrences as Event `b`, until the value of Dynamic `a` is `true`, and completes when Dynamic `a` is true.
*/
const take_until_true = dynamic => event =>
	dynamic.run()
		?
			never
		:
			take_until
				(gate
					(dynamic)
					(updates (dynamic))
				)
				(event);

const registry = new FinalizationRegistry(unobserve => unobserve());

/*
	Number => Event X => Event X
	Takes a number, `n`, and an Event, `a` and returns an Event with the same occurrences as Event `a`, until it completes or it has occurred `n` times, whichever comes first.
*/

/* TODO: test high level / minimal-byte implementation */
// export const take = n => event =>
// 	take_until
// 		(alt
// 			(complete (event))
// 			(nth (n) (event))
// 		)
// 		(event)

	// (take_until_true
	// 	(map
	// 		(x => x === n)
	// 		(count (event))
	// 	)
	// 	(event)

const _take = (n, input_event, input_event_complete) => {
	const observers = new Map();

	let i = 0;

	const self = {
		computed: null,
		occurred: null,
		observers,
		settled: true,
		value: nothing$1,
		observe: observer => {
			const id = Symbol();
			observers.set(id, observer);

			catch_up_observer (self, observer, false);

			return () => observers.delete(id)
		}
	};

	const dependency_observer = {
		pre_compute: (dependency, cycle_allowed) => {
			if (!self.settled) {
				return
			}
			self.computed = dependency.computed;
			self.settled = false;
			pre_compute_observers(self, cycle_allowed);
		},
		compute: () => {
			if (self.settled) {
				return
			}
			const { post_propagation } = self.computed;
			if (input_event.settled && input_event_complete.settled) {
				self.settled = true;
				if (input_event.value !== nothing$1) {
					++i;
				}
				if (i === n || input_event_complete.value !== nothing$1) {
					self.occurred = self.computed;
					self.value = input_event.value !== nothing$1 ? input_event.value : input_event_complete.value;
					post_propagation.add(() => {
						self.value = nothing$1;
						unobserve_input_event();
						unobserve_input_complete_event();
					});
				}
				compute_observers(self);
			}
		}
	};

	self.complete = self;

	let unobserve_input_event;
	let unobserve_input_complete_event;

	_call(input_event.observe, input_event_observe =>
		_call(input_event_complete.observe, input_event_complete_observe => {
			unobserve_input_event = input_event_observe(dependency_observer);
			unobserve_input_complete_event = input_event_complete_observe(dependency_observer);

			registry.register(self, () => {
				unobserve_input_event();
				unobserve_input_complete_event();
			});
		})
	);

	return _take_until(self, input_event)
};

const take = n => input_event =>
	_use(input_event, input_event =>
		_use(input_event.complete, input_event_complete =>
			_take(n, input_event, input_event_complete)
		)
	);

/*
(X => Boolean) => Event X => Event X
Takes a predicate function, `f`, and an Event, `a`, and returns an Event with the same occurrences as Event `a`, until `f` returns true for the value of `a`, and completes when `f` returns true for the value of `a`.
*/
const take_until_passes = f => event =>
	take_until
		(filter (f) (event))
		(event);

var index$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	alt: alt,
	complete: complete,
	completed: completed,
	_calling: _calling$1,
	calling: calling$2,
	count: count,
	delay: delay,
	exposed_producer: exposed_producer,
	Error_Cycle_Detected: Error_Cycle_Detected,
	filter: filter,
	from_promise: from_promise,
	_hold: _hold,
	hold: hold,
	_is_complete: _is_complete,
	is_complete: is_complete,
	_map: _map$1,
	map: map$2,
	merge_array: merge_array,
	_merge_2_with: _merge_2_with,
	merge_2_with: merge_2_with,
	never: never,
	nothing: nothing,
	once: once$1,
	on_demand_producer: on_demand_producer,
	performing: performing,
	performed: performed,
	scan: scan,
	_snapshot: _snapshot,
	snapshot: snapshot,
	create_switch: create_switch,
	switch_updating: switch_updating,
	switching: switching,
	tag: tag,
	_take: _take,
	take: take,
	_take_until: _take_until,
	take_until: take_until,
	take_until_passes: take_until_passes,
	take_until_true: take_until_true,
	wait: wait
});

const of$1 = x => construct(() => x);

const chain = f => s =>
	construct (instant => f (s.run (instant)).run (instant));

const lift2 = f => x1 => x2 =>
	construct (
		instant =>
			f
				(x1.run(instant))
				(x2.run(instant))
	);

const unix_timestamp = construct (Date.now);

const iso8601_timestamp = map$1 (x => new Date(x).toISOString()) (unix_timestamp);

var index$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	construct: construct,
	of: of$1,
	chain: chain,
	lift2: lift2,
	iso8601_timestamp: iso8601_timestamp,
	unix_timestamp: unix_timestamp
});

const calling = f => map$3 (calling$2 (f));

const fetch = ({ url, abort, ...options }) =>
	construct$2 (() =>
		once (
			producer (
				produce =>
					globalThis.fetch(url, { ...options })
						.then(produce)
						.catch(error => error.code !== 'AbortError' && produce(error))
			)
		)
	);

const from_async_function = f => map$3 (from_promise) (from_function (f));

const of = value => ({
	run: instant => {
		const observers = new Map();

		const event = {
			computed: instant,
			occurred: instant,
			observers,
			settled: true,
			value,
			observe: observer => {
				const id = Symbol();
				observers.set(id, observer);

				catch_up_observer (event, observer);

				return () => observers.delete(id)
			}
		};

		event.complete = event;

		return event
	}
});

var index = /*#__PURE__*/Object.freeze({
	__proto__: null,
	calling: calling,
	fetch: fetch,
	from_async_function: from_async_function,
	of: of
});

const subsequently = x => _ => x;

exports.Action = index$5;
exports.Dynamic = index$3;
exports.Event = index$2;
exports.Reference = index$4;
exports.Sample = index$1;
exports.Task = index;
exports.create_instant = create_instant;
exports.immediately = immediately;
exports.subsequently = subsequently;
