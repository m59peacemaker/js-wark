'use strict';

const create$2 = () => ({
	cache: new Map(),
	post_computations: []
});

const perform = action => action.perform(create$2());

var index$4 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	perform: perform
});

const construct$1 = f => ({
	perform: f
});

const Apply = construct => f => x =>
	construct (instant =>
		f.perform(instant) (x.perform(instant))
	);

const apply$1 = Apply (construct$1);

const Chain = construct => f => x =>
	construct (instant => f (x.perform(instant)).perform(instant));

const chain$1 = Chain (construct$1);

const from$1 = f => construct$1(() => f());

const Join = construct => x =>
	construct (instant => x.perform(instant).perform(instant));

const join$2 = Join (construct$1);

const Lift_2 = construct => f => x1 => x2 =>
	construct (instant =>
		f
			(x1.perform(instant))
			(x2.perform(instant))
	);

const lift_2$1 = Lift_2 (construct$1);

const Lift_3 = construct => f => x1 => x2 => x3 =>
	construct (instant =>
		f
			(x1.perform(instant))
			(x2.perform(instant))
			(x3.perform(instant))
	);

const lift_3$1 = Lift_3 (construct$1);

const Map$1 = construct => f => x =>
	construct (
		instant =>
			f (x.perform(instant))
	);

const map$4 = Map$1 (construct$1);

const Of = construct => x => construct(() => x);

const of$3 = Of (construct$1);

var index$3 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	apply: apply$1,
	chain: chain$1,
	construct: construct$1,
	from: from$1,
	join: join$2,
	lift_2: lift_2$1,
	lift_3: lift_3$1,
	map: map$4,
	of: of$3
});

const get_computation = (compute, instant) => {
	const cache = instant.cache.get(compute);
	if (cache) {
		return cache
	} else {
		const cache = {};
		instant.cache.set(compute, cache);
		/*
			It is odd to call `compute` here,
			but the calling code always at least calls `is_occurring` next,
			which leads to calling `compute`,
			so it is efficient to call and cache it now,
			so `is_occurring` can always use the cached value.
		*/
		cache.compute_value = typeof compute === 'object'
			?
				// compute function belongs to a producer and it is not occurring right now
				false
			:
				compute(instant);
		return cache
	}
};

const get_value = computation => {
	if ('value' in computation) {
		return computation.value
	} else {
		return computation.value = computation.compute_value()
	}
};

/*
	Since operators always call `get_computation` and then `is_occurring`,
	`get_computation` has already cached the first step of the computation,
	so just use the cached value here.
	Otherwise, the code would be:
	const is_occurring = computation => {
		if ('compute_value' in computation === false) {
			computation.compute_value = computation.compute()
		}
		return computation.compute_value !== false
	}
*/
const is_occurring = computation => computation.compute_value !== false;

const undetermined = Symbol('undetermined');

const registry = new FinalizationRegistry(f => f());

const register_finalizer = (target, value) => {
	const id = {};
	registry.register(target, value);
	return () => registry.unregister(id)
};

const combine = f => dynamics => {
	let value = undetermined;
	let completed_value = undetermined;
	const dependants = new Map();
	const completion_dependants = new Map();

	const perform = () => {
		if (value === undetermined) {
			value = f(dynamics.map(dynamic => dynamic.perform()));
		}
		return value
	};

	const updates = {
		occurrences: {
			compute: instant => {
				let occurring = false;
				const value_getters = [];
				for (const dynamic of dynamics) {
					/*
						TODO:
							These conditions are awkward due to avoiding `get_computation` when an event is already complete.
							See if this can be improved.
					*/
					if (dynamic.updates.completed.perform()) {
						value_getters.push(dynamic.perform);
					} else {
						const computation = get_computation(dynamic.updates.occurrences.compute, instant);
						if (is_occurring(computation)) {
							occurring = true;
							value_getters.push(() => get_value(computation));
						} else {
							value_getters.push(dynamic.perform);
						}
					}
				}
				return occurring && (() => f(value_getters.map(f => f())))
			},
			join_propagation: f => {
				const id = Symbol();
				dependants.set(id, f);
				return () => dependants.delete(id)
			}
		},
		completed: {
			perform: () => {
				if (completed_value = undetermined) {
					completed_value = dynamics.every(dynamic => dynamic.updates.completed.perform());
				}
				return completed_value
			},
			updates: {
				compute: instant =>
					dynamics.every(dynamic =>
						dynamic.updates.completed.perform()
							|| is_occurring(get_computation(dynamic.updates.completed.updates.compute, instant))
					)
						?
							() => true
						:
							false
				,
				join_propagation: f => {
					const id = Symbol();
					completion_dependants.set(id, f);
					return () => completion_dependants.delete(id)
				}
			}
		}
	};

	const compute_propagation = instant => {
		for (const f of dependants.values()) {
			f(instant);
		}

		const computation = get_computation(updates.occurrences.compute, instant);
		if (is_occurring(computation)) {
			instant.post_computations.push(instant => {
				if ('value' in computation) {
					value = computation.value;
				} else {
					value = undetermined;
				}
			});
		}
	};

	const compute_completion_propagation = instant => {
		for (const f of completion_dependants.values()) {
			f(instant);
		}

		// TODO: this is probably not efficient for this case
		const computation = get_computation(updates.completed.updates.compute, instant);
		if (is_occurring(computation)) {
			instant.post_computations.push(instant => {
				if ('value' in computation) {
					completed_value = computation.value;
				} else {
					completed_value = undetermined;
				}
			});
		}
	};


	for (const dynamic of dynamics) {
		if (dynamic.updates.completed.perform() === false) {
			const leave_propagation = dynamic.updates.occurrences.join_propagation(instant => {
				get_computation(compute_propagation, instant);
			});

			const compute_completion = instant => {
				if (is_occurring(updates.completed.updates.compute)) {
					get_computation(compute_completion_propagation, instant);
					instant.post_computations.push(() => {
						leave_propagation();
						leave_completion_propagation();
						unregister_finalizer();
					});
				}
			};

			const leave_completion_propagation = dynamic.updates.completed.updates.join_propagation(instant =>
				/*
					TODO:
						this function is probably only called once per instant anyway,
						so there should be no need to interact with the cache (via get_computation)
						rather than running the code directly.
						This needs investigation.
				*/
				get_computation(compute_completion, instant)
			);

			const unregister_finalizer = register_finalizer(updates, () => {
				leave_propagation();
				leave_completion_propagation();
			});
		}
	}

	return {
		perform,
		updates
	}
};

const no_op = () => {};

const no_op_x2 = () => no_op;

const never$1 = {
	compute: () => false,
	join_propagation: no_op_x2
};

const of$2 = value => ({
	perform: () => value,
	updates: never$1
});

const never = ({
	occurrences: never$1,
	completed: of$2 (true)
});

const of$1 = value => ({
	perform: () => value,
	updates: never
});

const hold = initial_value => updates => {
	if (updates.completed.perform()) {
		return of$1 (initial_value)
	}

	let value = initial_value;

	const leave_propagation = updates.occurrences.join_propagation(instant => {
		const updates_computation = get_computation(updates.occurrences.compute, instant);
		if (is_occurring(updates_computation)) {
			const updated_value = get_value(updates_computation);
			instant.post_computations.push(() => {
				value = updated_value;
			});
		}
	});

	const leave_completion_propagation = updates.completed.updates.join_propagation(instant => {
		if (is_occurring(get_computation(updates.completed.updates.compute, instant))) {
			instant.post_computations.push(() => {
				leave_propagation();
				leave_completion_propagation();
				unregister_finalizer();
			});
		}
	});

	const unregister_finalizer = register_finalizer(updates, () => {
		leave_propagation();
		leave_completion_propagation();
	});

	return {
		updates,
		perform: () => value
	}
};

const join_propagation = (f, propagation) => {
	propagation.add(f);
	return () => propagation.delete(f)
};

const produce = (self, propagation, value) => {
	const instant = create$2();
	instant.cache.set(self.compute, { compute_value: () => value, value });
	for (const f of propagation) {
		f(instant);
	}
	for (const f of instant.post_computations) {
		f();
	}
};

const construct_producer$1 = f => {
	const propagation = new Set();

	/*
		TODO:
			Setting producer.compute to a symbol is ugly,
			but it works and was the best I could do for efficiency so far.
	*/
	const self = {
		compute: {},
		join_propagation: f => join_propagation(f, propagation)
	};

	f(value => produce(self, propagation, value));

	return self
};

const construct_producer = f => ({
	occurrences: construct_producer$1 (f),
	completed: of$2 (false)
});

const create$1 = () => {
	let produce;
	const x = construct_producer (x => produce = x);
	x.produce = produce;
	return x
};

const create = initial_value => hold (initial_value) (create$1());

const join$1 = outer_dynamic => {
	const dependants = new Map();
	const completion_dependants = new Map();
	let leave_outer_dynamic_updates_propagation = null;
	let leave_inner_dynamic_updates_propagation = null;
	let leave_outer_dynamic_updates_completion_propagation = null;
	let leave_inner_dynamic_updates_completion_propagation = null;

	const propagate = instant => {
		for (const f of dependants.values()) {
			f(instant);
		}
	};

	const propagate_completion = instant => {
		for (const f of completion_dependants.values()) {
			f(instant);
		}
	};

	const join_inner_dynamic_updates_propagation = () => {
		const inner_dynamic = outer_dynamic.perform();
		leave_inner_dynamic_updates_propagation = inner_dynamic.updates.occurrences.join_propagation(instant => {
			if (is_occurring(get_computation(inner_dynamic.updates.occurrences.compute, instant))) {
				get_computation(propagate, instant);
			}
		});
	};

	const join_inner_dynamic_updates_completion_propagation = () => {
		const inner_dynamic = outer_dynamic.perform();
		leave_inner_dynamic_updates_completion_propagation = inner_dynamic.updates.completed.updates.join_propagation(instant => {
			if (is_occurring(get_computation(inner_dynamic.updates.completed.updates.compute, instant))) {
				get_computation(propagate_completion, instant);
			}
		});
	};

	const updates = {
		occurrences: {
			compute: instant => {
				// TODO: simplify these conditions if possible
				if (outer_dynamic.updates.completed.perform()) {
					const inner_dynamic = outer_dynamic.perform();
					const inner_updates_computation = get_computation(inner_dynamic.updates.occurrences.compute, instant);
					return is_occurring(inner_updates_computation)
						?
							() => get_value (inner_updates_computation)
						:
							false
				} else {
					const outer_dynamic_updates_computation = get_computation(
						outer_dynamic.updates.occurrences.compute,
						instant
					);
					if (is_occurring(outer_dynamic_updates_computation)) {
						const inner_dynamic = get_value(outer_dynamic_updates_computation);
						const inner_updates_computation = get_computation(inner_dynamic.updates.occurrences.compute, instant);
						return is_occurring(inner_updates_computation)
							?
								() => get_value(inner_updates_computation)
							:
								inner_dynamic.perform
					} else {
						const inner_dynamic = outer_dynamic.perform();
						const inner_updates_computation = get_computation(inner_dynamic.updates.occurrences.compute, instant);
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
				const id = Symbol();
				dependants.set(id, f);
				if (dependants.size === 1) {
					leave_outer_dynamic_updates_propagation = outer_dynamic.updates.occurrences.join_propagation(instant => {
						if (is_occurring(get_computation(outer_dynamic.updates.occurrences.compute, instant))) {
							get_computation(propagate, instant);
							instant.post_computations.push(instant => {
								if (dependants.size > 0) {
									leave_inner_dynamic_updates_propagation();
									join_inner_dynamic_updates_propagation();
								}
							});
						}
					});
					join_inner_dynamic_updates_propagation();
				}
				return () => {
					dependants.delete(id);
					if (dependants.size === 0) {
						leave_outer_dynamic_updates_propagation();
						leave_outer_dynamic_updates_propagation = null;
						leave_inner_dynamic_updates_propagation();
						leave_inner_dynamic_updates_propagation = null;
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
						const inner_updates = outer_dynamic.perform().updates;
						const is_complete = inner_updates.completed.perform()
							|| is_occurring(get_computation(inner_updates.completed.updates.compute, instant));
						return is_complete && (() => true)
					} else {
						const outer_dynamic_updates_computation = get_computation(
							outer_dynamic.updates.occurrences.compute,
							instant
						);
						const inner_dynamic = is_occurring(outer_dynamic_updates_computation)
							?
								get_value(outer_dynamic_updates_computation)
							:
								outer_dynamic.perform();
						const inner_dynamic_updates_is_complete = inner_dynamic.updates.completed.perform()
							|| is_occurring(get_computation(inner_dynamic.updates.completed.updates.compute, instant));
						const is_complete = inner_dynamic_updates_is_complete
							&& is_occurring(get_computation(outer_dynamic.updates.completed.updates.compute, instant));
						return is_complete && (() => true)
					}
				},
				join_propagation: f => {
					const id = Symbol();
					completion_dependants.set(id, f);
					if (completion_dependants.size === 1) {
						leave_outer_dynamic_updates_completion_propagation = outer_dynamic.updates.completed.updates.join_propagation(instant => {
							if (is_occurring(get_computation(outer_dynamic.updates.completed.updates.compute, instant))) {
								get_computation(propagate_completion, instant);
								instant.post_computations.push(instant => {
									if (completion_dependants.size > 0) {
										leave_inner_dynamic_updates_completion_propagation();
										join_inner_dynamic_updates_completion_propagation();
									}
								});
							}
						});
						join_inner_dynamic_updates_completion_propagation();
					}
					return () => {
						completion_dependants.delete(id);
						if (completion_dependants.size === 0) {
							leave_outer_dynamic_updates_completion_propagation();
							leave_outer_dynamic_updates_completion_propagation = null;
							leave_inner_dynamic_updates_completion_propagation();
							leave_inner_dynamic_updates_completion_propagation = null;
						}
					}
				}
			}
		}
	};

	return {
		perform: () => outer_dynamic.perform().perform(),
		updates
	}
};

const map$3 = f => x => ({
	compute: instant => {
		const x_computation = get_computation(x.compute, instant);
		return is_occurring(x_computation)
			?
				() => f(get_value(x_computation))
			:
				false
	},
	join_propagation: x.join_propagation
});

const map$2 = f => x => {
	let value = undetermined;
	
	const perform = () => {
		if (value === undetermined) {
			value = f(x.perform());
		}
		return value
	};

	if (x.updates.completed.perform()) {
		return {
			updates: never,
			perform
		}
	}

	const updates_occurrences = map$3 (f) (x.updates.occurrences);

	const leave_propagation = updates_occurrences.join_propagation(instant => {
		const computation = get_computation(updates_occurrences.compute, instant);
		/*
			Check `is_occurring` during regular computation phase,
			so as not to race with with state changes in the post computation phase.
		*/
		if (is_occurring(computation)) {
			instant.post_computations.push(() => {
				/*
					Check whether a value was cached during the post computation phase,
					so as not to race with it being computed and cached during the computation phase.
				*/
				if ('value' in computation) {
					value = computation.value;
				} else {
					value = undetermined;
				}
			});
		}
	});

	const leave_completion_propagation = x.updates.completed.updates.join_propagation(instant => {
		if (is_occurring(x.updates.completed.updates.compute)) {
			instant.post_computations.push(() => {
				leave_propagation();
				leave_completion_propagation();
				unregister_finalizer();
			});
		}
	});

	const updates = {
		occurrences: updates_occurrences,
		completed: x.updates.completed
	};

	const unregister_finalizer = register_finalizer(updates, () => {
		leave_propagation();
		leave_completion_propagation();
	});

	return {
		perform,
		updates
	}
};

const switching$1 = outer_dynamic => {
	const dependants = new Map();
	const completion_dependants = new Map();
	let leave_outer_dynamic_updates_propagation = null;
	let leave_inner_event_propagation = null;
	let leave_outer_dynamic_updates_completion_propagation = null;
	let leave_inner_event_completion_propagation = null;

	const propagate = instant => {
		for (const f of dependants.values()) {
			f(instant);
		}
	};

	const propagate_completion = instant => {
		for (const f of completion_dependants.values()) {
			f(instant);
		}
	};

	const join_inner_event_propagation = () => {
		const inner_event = outer_dynamic.perform();
		leave_inner_event_propagation = inner_event.occurrences.join_propagation(instant => {
			if (is_occurring(get_computation(inner_event.occurrences.compute, instant))) {
				get_computation(propagate, instant);
			}
		});
	};

	const join_inner_event_completion_propagation = () => {
		const inner_event = outer_dynamic.perform();
		leave_inner_event_completion_propagation = inner_event.completed.updates.join_propagation(instant => {
			if (is_occurring(get_computation(inner_event.completed.updates.compute, instant))) {
				get_computation(propagate_completion, instant);
			}
		});
	};

	return {
		occurrences: {
			compute: instant => {
				if (outer_dynamic.updates.completed.perform()) {
					const inner_event = outer_dynamic.perform();
					const inner_event_computation = get_computation(inner_event.occurrences.compute, instant);
					return is_occurring(inner_event_computation)
						?
							() => get_value (inner_event_computation)
						:
							false
				} else {
					const outer_dynamic_updates_computation = get_computation(
						outer_dynamic.updates.occurrences.compute,
						instant
					);
					if (is_occurring(outer_dynamic_updates_computation)) {
						const focusing_inner_event = get_value(outer_dynamic_updates_computation);
						const inner_event_computation = get_computation(focusing_inner_event.occurrences.compute, instant);
						return is_occurring(inner_event_computation)
							?
								() => get_value(inner_event_computation)
							:
								false
					} else {
						const focused_inner_event = outer_dynamic.perform();
						const inner_event_computation = get_computation(focused_inner_event.occurrences.compute, instant);
						return is_occurring(inner_event_computation)
							?
								() => get_value(inner_event_computation)
							:
								false
					}
				}
			},
			join_propagation: f => {
				const id = Symbol();
				dependants.set(id, f);
				if (dependants.size === 1) {
					leave_outer_dynamic_updates_propagation = outer_dynamic.updates.occurrences.join_propagation(instant => {
						if (is_occurring(get_computation(outer_dynamic.updates.occurrences.compute, instant))) {
							get_computation(propagate, instant);
							instant.post_computations.push(instant => {
								if (dependants.size > 0) {
									leave_inner_event_propagation();
									join_inner_event_propagation();
								}
							});
						}
					});
					join_inner_event_propagation();
				}
				return () => {
					dependants.delete(id);
					if (dependants.size === 0) {
						leave_outer_dynamic_updates_propagation();
						leave_outer_dynamic_updates_propagation = null;
						leave_inner_event_propagation();
						leave_inner_event_propagation = null;
					}
				}
			}
		},
		completed: {
			perform: () =>
				outer_dynamic.updates.completed.perform() && outer_dynamic.perform().completed.perform()
			,
			updates: {
				compute: instant => {
					if (outer_dynamic.updates.completed.perform()) {
						const inner_event = outer_dynamic.perform();
						const is_complete = inner_event.completed.perform()
							|| is_occurring(get_computation(inner_event.completed.updates.compute, instant));
						return is_complete && (() => true)
					} else {
						const outer_dynamic_updates_computation = get_computation(
							outer_dynamic.updates.occurrences.compute,
							instant
						);
						const inner_event = is_occurring(outer_dynamic_updates_computation)
							?
								get_value(outer_dynamic_updates_computation)
							:
								outer_dynamic.perform();
						const inner_event_is_complete = inner_event.completed.perform()
							|| is_occurring(get_computation(inner_event.completed.updates.compute, instant));
						const is_complete = inner_event_is_complete
							&& is_occurring(get_computation(outer_dynamic.updates.completed.updates.compute, instant));
						return is_complete && (() => true)
					}
				},
				join_propagation: f => {
					const id = Symbol();
					completion_dependants.set(id, f);
					if (completion_dependants.size === 1) {
						leave_outer_dynamic_updates_completion_propagation = outer_dynamic.updates.completed.updates.join_propagation(instant => {
							if (is_occurring(get_computation(outer_dynamic.updates.completed.updates.compute, instant))) {
								get_computation(propagate_completion, instant);
								instant.post_computations.push(instant => {
									if (completion_dependants.size > 0) {
										leave_inner_event_completion_propagation();
										join_inner_event_completion_propagation();
									}
								});
							}
						});
						join_inner_event_completion_propagation();
					}
					return () => {
						completion_dependants.delete(id);
						if (completion_dependants.size === 0) {
							leave_outer_dynamic_updates_completion_propagation();
							leave_outer_dynamic_updates_completion_propagation = null;
							leave_inner_event_completion_propagation();
							leave_inner_event_completion_propagation = null;
						}
					}
				}
			}
		}
	}
};

const updates = x => x.updates;

var index$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	combine: combine,
	create: create,
	join: join$1,
	map: map$2,
	of: of$1,
	switching: switching$1,
	updates: updates
});

const nothing = Symbol('nothing');

/*
	TODO:
		merge_2 is the most generic way to merge occurrences,
		but it's also therefore the least efficient.
		Most things derived from this would have better performance by implementing them directly
		with similar low level code.
*/

const a_merge_2 = (f, x, _) => ({
	occurrences: {
		compute: instant => {
			const computation = get_computation(x.occurrences.compute, instant);
			const value = is_occurring(computation)
				?
					f
						(get_value(computation))
						(nothing)
					:
						nothing;
			return value === nothing ? false : () => value
		},
		join_propagation: x.occurrences.join_propagation
	},
	completed: x.completed
});

const b_merge_2 = (f, _, x) => ({
	occurrences: {
		compute: instant => {
			const computation = get_computation(x.occurrences.compute, instant);
			const value = is_occurring(computation)
				?
					f
						(get_value(computation))
						(nothing)
					:
						nothing;
			return value === nothing ? false : () => value
		},
		join_propagation: x.occurrences.join_propagation
	},
	completed: x.completed
});

const a_b_merge_2 = (f, a, b) => {
	const dependants = new Map();
	const completion_dependants = new Map();
	let leave_a_propagation = no_op;
	let leave_b_propagation = no_op;
	let leave_a_completion_propagation = no_op;
	let leave_b_completion_propagation = no_op;

	const propagate = instant => {
		for (const f of dependants.values()) {
			f(instant);
		}
	};

	const propagate_completion = instant => {
		for (const f of completion_dependants.values()) {
			f(instant);
		}
	};

	const join_completion_propagation = () => {
		leave_a_completion_propagation = a.completed.updates.join_propagation(instant => {
			if (is_occurring(get_computation(a.completed.updates.compute, instant))) {
				get_computation(propagate_completion, instant);
				instant.post_computations.push(() => {
					leave_a_propagation();
					leave_a_completion_propagation();
				});
			}
		});
		leave_b_completion_propagation = b.completed.updates.join_propagation(instant => {
			if (is_occurring(get_computation(b.completed.updates.compute, instant))) {
				get_computation(propagate_completion, instant);
				instant.post_computations.push(() => {
					leave_b_propagation();
					leave_b_completion_propagation();
				});
			}
		});
	};

	const join_propagation = () => {
		if (a.completed.perform() === false) {
			leave_a_propagation = a.occurrences.join_propagation(instant => {
				get_computation(propagate, instant);
			});
		}

		if (b.completed.perform() === false) {
			leave_b_propagation = b.occurrences.join_propagation(instant => {
				get_computation(propagate, instant);
			});
		}
	};

	return {
		completed: {
			updates: {
				compute: instant => {
					const a_computation = get_computation(a.completed.updates.compute, instant);
					const b_computation = get_computation(b.completed.updates.compute, instant);
					const a_is_complete = a.completed.perform() || is_occurring(a_computation);
					const b_is_complete = b.completed.perform() || is_occurring(b_computation);
					const is_complete = a_is_complete && b_is_complete;
					return is_complete
						?
							() => true
						: false
				},
				join_propagation: f => {
					const id = Symbol();
					completion_dependants.set(id, f);
					if (completion_dependants.size + dependants.size === 1) {
						join_completion_propagation();
					}
					return () => {
						completion_dependants.delete(id);
						if (completion_dependants.size + dependants.size === 0) {
							leave_a_completion_propagation();
							leave_b_completion_propagation();
						}
					}
				}
			},
			perform: () => a.completed.perform() && b.completed.perform()
		},
		occurrences: {
			compute: instant => {
				if (a.completed.perform()) {
					const b_computation = get_computation(b.occurrences.compute, instant);
					const value = is_occurring(b_computation)
						?
							f
								(nothing)
								(get_value(b_computation))
							:
								nothing;
					return value === nothing ? false : () => value
				} else if (b.completed.perform()) {
					const a_computation = get_computation(a.occurrences.compute, instant);
					const value = is_occurring(a_computation)
						?
							f
								(nothing)
								(get_value(a_computation))
							:
								nothing;
					return value === nothing ? false : () => value
				} else {
					const a_computation = get_computation(a.occurrences.compute, instant);
					const b_computation = get_computation(b.occurrences.compute, instant);
					const a_is_occurring = is_occurring(a_computation);
					const b_is_occurring = is_occurring(b_computation);
					const value = a_is_occurring || b_is_occurring
						?
							f
								(a_is_occurring ? get_value(a_computation) : nothing)
								(b_is_occurring ? get_value(b_computation) : nothing)
						:
							nothing;
					return value === nothing ? false : () => value
				}
			},
			join_propagation: f => {
				const id = Symbol();
				dependants.set(id, f);
				if (dependants.size === 1) {
					join_propagation();
					if (completion_dependants.size === 0) {
						join_completion_propagation();
					}
				}
				return () => {
					dependants.delete(id);
					if (dependants.size === 0) {
						leave_a_propagation();
						leave_b_propagation();
						leave_a_propagation = no_op;
						leave_b_propagation = no_op;
						if (completion_dependants.size === 0) {
							leave_a_completion_propagation();
							leave_b_completion_propagation();
						}
					}
				}
			}
		}
	}
};

const merge_2 = f => a => b => {
	if (a.completed.perform() && b.completed.perform()) {
		return never
	} else if (a.completed.perform()) {
		return b_merge_2(f, a, b)
	} else if (b.completed.perform()) {
		return a_merge_2(f, a)
	} else {
		return a_b_merge_2(f, a, b)
	}
};

const alt = merge_2 (y => x => x === nothing ? y : x);

const calling = f => x => {
	if (x.completed.perform()) {
		return never
	} else {
		const occurrences = {
			compute: instant => {
				const x_computation = get_computation(x.occurrences.compute, instant);
				return is_occurring(x_computation)
					?
						() => f(get_value(x_computation))
					:
						false
			},
			join_propagation: x.occurrences.join_propagation
		};

		const compute_occurrence = instant => {
			const computation = get_computation(occurrences.compute, instant);
			if (is_occurring(computation)) {
				get_value(computation);
			}
		};

		const leave_propagation = x.occurrences.join_propagation(instant => {
			get_computation(compute_occurrence, instant);
		});

		const compute_completion = instant => {
			if (is_occurring(get_computation(x.completed.updates.compute, instant))) {
				instant.post_computations.push(() => {
					leave_propagation();
					leave_completion_propagation();
				});
			}
		};

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
			get_computation(compute_completion, instant);
			// compute(compute_completion, instant)
			// instant.computations.push(instant => get_computation(compute_completion, instant))
		});

		return {
			occurrences,
			completed: x.completed
		}
	}
};

const completion = x => ({
	completed: x.completed,
	occurrences: x.completed.updates
});

const construct_on_demand_producer$1 = producer_f => {
	const propagation = new Set();
	let deactivate;

	const _produce = value => produce(self, propagation, value);

	const self = {
		compute: {},
		join_propagation: f => {
			const activate = propagation.size === 0;
			const leave_propagation = join_propagation(f, propagation);
			if (activate) {
				deactivate = producer_f (_produce);
			}
			return () => {
				leave_propagation();
				if (propagation.size === 0) {
					deactivate();
				}
			}
		}
	};

	return self
};

const construct_on_demand_producer = producer_f => ({
	occurrences: construct_on_demand_producer$1 (producer_f),
	completed: of$2 (false)
});

// toggle (false) (take (1) (occurrences))
const observed = occurrences => {
	let value = false;

	const self = {
		updates: {
			compute: instant =>
				is_occurring(get_computation(occurrences.compute, instant)) && (() => true)
			,
			join_propagation: occurrences.join_propagation
		},
		perform: () => value
	};

	const compute_update = instant => {
		const computation = get_computation(occurrences.compute, instant);
		if (is_occurring(computation)) {
			instant.post_computations.push(instant => {
				value = true;
				leave_propagation();
				unregister_finalizer();
			});
		}
	};

	const leave_propagation = occurrences.join_propagation(instant => {
		/*
			TODO: if this function can only ever be called once per instant,
			call the code from `compute_update` directly in here rather than using get_computation
		*/
		get_computation(compute_update, instant);
	});

	const unregister_finalizer = register_finalizer(self, leave_propagation);

	return self
};

const complete_on = complete_event => subject_event => ({
	occurrences: subject_event.occurrences,
	completed: complete_event.completed.perform()
		?
			of$2 (true)
		:
			observed (complete_event.occurrences)
});

const filter$1 = f => x => ({
	compute: instant => {
		const x_computation = get_computation(x.compute, instant);
		if (is_occurring(x_computation)) {
			const x_value = get_value(x_computation);
			return f(x_value)
				?
					() => x_value
				:
					false
		} else {
			return false
		}
	},
	join_propagation: x.join_propagation
});

const filter = f => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: filter$1 (f) (x.occurrences),
				completed: x.completed
			}
};

const completed = x => ({
	perform: x.completed.perform,
	updates: {
		occurrences: x.completed.updates,
		completed: x.completed
	}
});

const map$1 = f => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: map$3 (f) (x.occurrences),
				completed: x.completed
			}
};

const scan = reducer => initial_value => event => {
	if (event.completed.perform()) {
		return of$1 (initial_value)
	}

	let value = initial_value;

	const updates = {
		occurrences: {
			compute: instant => {
				const computation = get_computation(event.occurrences.compute, instant);
				return is_occurring(computation)
					?
						() => reducer (get_value(computation)) (value)
					:
						false
			},
			join_propagation: event.occurrences.join_propagation
		},
		completed: event.completed
	};

	/*
		TODO:
			all the code below should be shareable with Event.hold by passing in `updates`.
			The only difference between them should be that `hold` uses the `updates` event passed into it, while `scan` has to derive its `updates` from the input event.
			Maybe `scan` should even be implemented from `hold`:
			```
			const updates = {
				// ...as above
					() => reducer (get_value(computation)) (self.perform())
			}
			const self = hold (initial_value) (updates)
			return self
	*/
	const leave_propagation = updates.occurrences.join_propagation(instant => {
		const updates_computation = get_computation(updates.occurrences.compute, instant);
		if (is_occurring(updates_computation)) {
			const updated_value = get_value(updates_computation);
			instant.post_computations.push(() => {
				value = updated_value;
			});
		}
	});

	const leave_completion_propagation = updates.completed.updates.join_propagation(instant => {
		if (is_occurring(get_computation(updates.completed.updates.compute, instant))) {
			instant.post_computations.push(() => {
				leave_propagation();
				leave_completion_propagation();
				unregister_finalizer();
			});
		}
	});

	const unregister_finalizer = register_finalizer(updates, () => {
		leave_propagation();
		leave_completion_propagation();
	});

	return {
		updates,
		perform: () => value
	}
};

const snapshot$1 = f => sample => x => ({
	compute: instant => {
		const x_computation = get_computation(x.compute, instant);
		return is_occurring(x_computation)
			?
				() => f (sample.perform(instant)) (get_value(x_computation))
			:
				false
	},
	join_propagation: x.join_propagation
});

const snapshot = f => sample => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: snapshot$1 (f) (sample) (x.occurrences),
				completed: x.completed
			}
};

const switching = event => switching$1 (hold (never) (event));

const tag = snapshot (x => y => x);

const wait$1  = ({ ms }) => {
	const propagation = new Set();
	let completed_value = false;

	const occurrences = {
		compute: {},
		join_propagation: f => join_propagation(f, propagation),
	};

	const completed = {
		perform: () => completed_value,
		updates: {
			compute: {},
			join_propagation: occurrences.join_propagation
		}
	};

	const compute_ref = new WeakRef(occurrences.compute);
	const completion_compute_ref = new WeakRef(completed.updates.compute);

	const timeout = setTimeout(
		() => {
			const instant = create$2();
			const compute = compute_ref.deref();
			const completion_compute = completion_compute_ref.deref();
			if (compute !== undefined) {
				instant.cache.set(compute, { compute_value: () => ms, value: ms });
			}
			if (completion_compute !== undefined) {
				instant.cache.set(completion_compute, { compute_value: () => true, value: true });
			}
			for (const f of propagation) {
				f(instant);
			}
			completed_value = true;
			for (const f of instant.post_computations) {
				f();
			}
		},
		ms
	);

	const unregister_compute_finalizer = register_finalizer(
		occurrences.compute,
		() => {
			if (completion_compute_ref.deref() === undefined) {
				clearTimeout(timeout);
				unregister_completion_compute_finalizer();
			}
		}
	);

	const unregister_completion_compute_finalizer = register_finalizer(
		completed.updates.compute,
		() => {
			if (compute_ref.deref() === undefined) {
				clearTimeout(timeout);
				unregister_compute_finalizer();
			}
		}
	);

	return {
		occurrences,
		completed
	}
};

var index$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	alt: alt,
	calling: calling,
	complete_on: complete_on,
	completed: completed,
	completion: completion,
	construct_on_demand_producer: construct_on_demand_producer,
	construct_producer: construct_producer,
	create: create$1,
	filter: filter,
	hold: hold,
	map: map$1,
	merge_2: merge_2,
	never: never,
	nothing: nothing,
	scan: scan,
	snapshot: snapshot,
	switching: switching,
	tag: tag,
	wait: wait$1
});

const construct = f => {
	const self = {
		perform: instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, f(instant));
			}
			return instant.cache.get(self)
		}
	};
	return self
};

const apply = Apply (construct);

const chain = Chain (construct);

const from = f => construct(() => f());

const get = sample => sample.perform(create$2());

const map = Map$1 (construct);

const unix_timestamp_ms = from (Date.now);

const iso8601_datetime = map
	(x => new Date(x).toISOString())
	(unix_timestamp_ms);

const join = Join (construct);

const lift_2 = Lift_2 (construct);

const lift_3 = Lift_3 (construct);

const of = Of (construct);

const memoize = f => {
	const cache = new Map();
	return x => {
		if (cache.has(x)) {
			return cache.get(x)
		}
		const value = f(x);
		cache.set(x, value);
		return value
	}
};

/*
	TODO: Maybe this can be better by somehow being more generic, like capturing the generic essence of memoization itself?
	and then this would be derived from a higher level composition rather than `construct`.
*/
const waiting = construct(() => memoize (ms => wait$1 ({ ms })));

const wait = ({ ms }) => map (f => f(ms)) (waiting);

var index = /*#__PURE__*/Object.freeze({
	__proto__: null,
	apply: apply,
	chain: chain,
	construct: construct,
	from: from,
	get: get,
	iso8601_datetime: iso8601_datetime,
	join: join,
	lift_2: lift_2,
	lift_3: lift_3,
	map: map,
	of: of,
	unix_timestamp_ms: unix_timestamp_ms,
	wait: wait
});

exports.Action = index$4;
exports.Dynamic = index$2;
exports.Effect = index$3;
exports.Event = index$1;
exports.Sample = index;
