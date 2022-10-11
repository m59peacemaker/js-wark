const uninitialized = Symbol('uninitialized');

class Reference {
	constructor (f) {
		this._value = uninitialized;
		this._dependants = new Set();
		this._queue = [];
		f(
			x => {
				if (x instanceof Reference) {
					if (this.has_dependant(x)) {
						let value = uninitialized;
						const tmp = new Proxy({}, {
							get (_, prop) {
								if (value !== uninitialized) {
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
		if (this._value === uninitialized) {
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

export { Reference };
