'use strict';

const get_value_with_cache = (instant, cache, x) => {
	if (cache.computed === false) {
		cache.computed = true;
		cache.value = x.compute(instant);
	}
	return cache.value
};

const _nothing = Symbol('_nothing');

const get_value = (instant, x) => {
	const cache = instant.cache.get(x);
	if (cache) {
		return get_value_with_cache(instant, cache, x)
	} else {
		return _nothing
	}
};

const registry = new FinalizationRegistry(f => f());

const register_finalizer = registry.register.bind(registry);

const hold = initial_value => updates => {
	let value = initial_value;

	const receive_update = instant => {
		instant.post_computations.push(instant => {
			const update_value = get_value(instant, updates);
			if (update_value !== _nothing) {
				value = update_value;
			}
		});
	};

	const self = {
		updates,
		perform: () => value,
		propagate: receive_update
	};

	updates.dependants.add(self);

	register_finalizer(self, () => updates.dependants.delete(self));

	const instant = updates.instant();
	if (instant !== null) {
		receive_update(instant);
	}

	return self
};

const create$1 = () => ({
	cache: new Map(),
	computations: [],
	post_computations: []
});

const producer = f => {
	let instant = null;
	const self = {
		instant: () => instant,
		dependants: new Set()
	};

	f(x => {
		instant = create$1();
		instant.cache.set(self, {
			computed: true,
			value: x
		});
		for (const dependant of self.dependants) {
			dependant.propagate(instant);
		}
		for (const f of instant.computations) {
			f(instant);
		}
		for (const f of instant.post_computations) {
			f(instant);
		}
		instant = null;
	});

	return self
};

const exposed_producer = () => {
	let produce;
	const x = producer(x => produce = x);
	x.produce = produce;
	return x
};

const create = initial_value => hold (initial_value) (exposed_producer());

const computed_in_instant = (instant, x) => {
	const cache = instant.cache.get(x);
	return cache && cache.computed
};

const undetermined = Symbol();

const map$2 = f => x => {
	const self = {
		instant: x.instant,
		compute: instant => {
			const x_value = get_value(instant, x);
			return x_value === _nothing ? _nothing : f(x_value)
		},
		propagate: instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, { computed: false, value: _nothing });
				// TODO: dependants can just be the propagate functions, instead of the objects
				for (const d of self.dependants) {
					d.propagate(instant);
				}
			}
		},
		dependants: new Set(),
	};

	x.dependants.add(self);

	const instant = x.instant();
	if (instant !== null) {
		instant.cache.set(self, { computed: false, value: _nothing });
	}

	return self
};

const map$1 = f => dynamic => {
	let value = undetermined;

	const updates = map$2 (f) (dynamic.updates);
	const receive_update = instant => {
		instant.post_computations.push(instant => {
			if (computed_in_instant(instant, updates)) {
				const update_value = get_value(instant, updates);
				if (update_value !== _nothing) {
					value = update_value;
				}
			} else {
				value = undetermined;
			}
		});
	};

	const self = {
		updates,
		perform: () => {
			if (value === undetermined) {
				value = f (dynamic.perform());
			}
			return value
		},
		propagate: receive_update
	};

	updates.dependants.add(self);

	const instant = dynamic.updates.instant();
	if (instant !== null) {
		receive_update(instant);
	}

	return self
};

const updates = dynamic => dynamic.updates;

var index$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	create: create,
	map: map$1,
	updates: updates
});

const calling = f => x => {
	const self = {
		instant: x.instant,
		compute: instant => {
			const x_value = get_value (instant, x);
			return x_value === _nothing ? _nothing : f(x_value)
		},
		propagate: instant => {
			if (!instant.cache.has(self)) {
				const cache = { computed: false, value: _nothing };
				instant.cache.set(self, cache);
				for (const d of self.dependants) {
					d.propagate(instant);
				}
				// Ensure this is computed, regardless of dependants.
				instant.computations.push(instant => get_value_with_cache(instant, cache, self));
			}
		},
		dependants: new Set()
	};

	x.dependants.add(self);

	const instant = x.instant();
	if (instant !== null) {
		const cache = { computed: false, value: _nothing };
		instant.cache.set(self, cache);
		instant.computations.push(instant => get_value_with_cache(instant, cache, self));
	}

	return self
};

const nothing = Symbol('nothing');

const merge_2_with = f => a => b => {
	const self = {
		instant: () => a.instant() || b.instant(),
		compute: instant => {
			const a_value = get_value (instant, a);
			const b_value = get_value (instant, b);
			const value = a_value === _nothing && b_value === _nothing
				? _nothing
				:
					f
						(a_value === _nothing ? nothing : a_value)
						(b_value === _nothing ? nothing : b_value);
			return value === nothing ? _nothing : value
		},
		propagate: instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, { computed: false, value: _nothing });
				for (const dependant of self.dependants) {
					dependant.propagate(instant);
				}
			}
		},
		dependants: new Set()
	};

	a.dependants.add(self);
	b.dependants.add(self);

	const instant = self.instant();
	if (instant !== null) {
		instant.cache.set(self, { computed: false, value: _nothing });
	}

	return self
};

const noop = () => {};

const never = ({
	instant: () => null,
	compute: () => _nothing,
	propagate: noop,
	dependants: { add: noop, delete: noop }
});

// import { Error_Cycle_Detected } from './Error_Cycle_Detected.js'

const switch_updating = resolve => initial_focused_event => source_event => {
	let focused_event = initial_focused_event;

	const self = {
		instant: () => initial_focused_event.instant() || source_event.instant(),
		compute: instant => {
			const focusing_event = get_value(instant, source_event);
			if (focusing_event === _nothing) {
				return get_value (instant, focused_event)
			} else {
				instant.post_computations.push(() => {
					focused_event.dependants.delete(self);
					focusing_event.dependants.add(self);
					focused_event = focusing_event;
				});
				const resolve_event = resolve (focused_event) (focusing_event);
				return get_value (instant, resolve_event)
			}
		},
		propagate: instant => {
			if (!instant.cache.has(self)) {
				const cache = { computed: false, value: _nothing };
				instant.cache.set(self, cache);
				for (const dependants of self.dependants) {
					dependants.propagate(instant);
				}
				// Ensure this computes, regardless of dependants.
				instant.computations.push(instant => get_value_with_cache(instant, cache, self));
			}
		},
		dependants: new Set()
	};

	source_event.dependants.add(self);
	focused_event.dependants.add(self);

	register_finalizer(self, () => {
		source_event.dependants.delete(self);
		focused_event.dependants.delete(self);
	});

	const instant = self.instant();
	if (instant !== null) {
		// TODO: rename cache to state
		const cache = { computed: false, value: _nothing };
		instant.cache.set(self, cache);
		instant.computations.push(instant => get_value_with_cache(instant, cache, self));
	}

	return self
};

const immediately = _ => y => y;

const switching = switch_updating (immediately) (never);

const tag = y => x => {
	const self = {
		instant: x.instant,
		compute: y.perform,
		propagate: instant => {
			if (!instant.cache.has(self)) {
				instant.cache.set(self, { computed: false, value: _nothing });
				for (const dependant of self.dependants) {
					dependant.propagate(instant);
				}
			}
		},
		dependants: new Set(),
	};

	x.dependants.add(self);

	const instant = x.instant();
	if (instant !== null) {
		instant.cache.set(self, { computed: false, value: _nothing });
	}

	return self
};

const weak_producer = f => {
	let instant = null;

	const self = {
		instant: () => instant,
		dependants: new Set()
	};

	const self_ref = new WeakRef(self);

	register_finalizer(
		self,
		// TODO: extract and share 'produce' logic among producers
		f(x => {
			const self = self_ref.deref();
			instant = create$1();
			instant.cache.set(self, {
				computed: true,
				value: x
			});
			for (const dependant of self.dependants) {
				dependant.propagate(instant);
			}
			for (const f of instant.computations) {
				f(instant);
			}
			for (const f of instant.post_computations) {
				f(instant);
			}
			instant = null;
		})
	);

	return self
};

// import { once } from './once.js'

const wait$1 = ({ ms }) =>
	// TODO: once
	// once (
		weak_producer (produce => {
			const timeout = setTimeout (() => produce (ms), ms);
			timeout.unref && timeout.unref();
			return () => clearTimeout (timeout)
		});
	// )

var index$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	calling: calling,
	exposed_producer: exposed_producer,
	hold: hold,
	map: map$2,
	merge_2_with: merge_2_with,
	never: never,
	switch_updating: switch_updating,
	switching: switching,
	tag: tag,
	wait: wait$1,
	weak_producer: weak_producer
});

const get = sample => sample.perform(create$1());

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

const map = f => x =>
	construct (
		instant =>
			f (x.perform(instant))
	);

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
	get: get,
	map: map,
	wait: wait
});

const subsequently = x => _ => x;

exports.Dynamic = index$2;
exports.Event = index$1;
exports.Sample = index;
exports.immediately = immediately;
exports.subsequently = subsequently;
