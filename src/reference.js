const uninitialized = Symbol('uninitialized')

class Reference {
	constructor (f) {
		this._value = uninitialized
		this._dependants = new Set()
		this._queue = []
		f(
			x => {
				if (x instanceof Reference) {
					if (this.has_dependant(x)) {
						let value = uninitialized
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
						})
						this._set(tmp)
						x.get(null, x => value = x)
					} else {
						x.get(create(), this._set.bind(this))
					}
				} else {
					this._set(x)
				}
				return x
			},
			this
		)
	}
	_set (x) {
		this._value = x
		while (this._queue.length > 0) {
			this._queue.pop()(x)
		}
	}
	get (dependant, f) {
		if (this._value === uninitialized) {
			if (dependant) {
				this._dependants.add(dependant)
			}
			this._queue.push(f)
		} else {
			f(this._value)
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

export const construct = f => new Reference(f)

export const create = () => {
	let assign
	const reference = construct(x => {
		assign = x
	})
	reference.assign = assign
	return reference
}

export const of = value => construct (assign => assign(value))

export const get = (dependant, x, f) => {
	if (x instanceof Reference) {
		x.get(dependant, f)
	} else {
		f (x)
	}
}

export const call = f => x => get(null, x, f)

// slightly more efficient than `use (f) (x)`
export const _use = (x, f) => {
	if (x instanceof Reference) {
		return construct ((assign, reference) => x.get(reference, x => assign (f (x))))
	} else {
		return f (x)
	}
}

export const use = f => x => _use (x, f)

export const use2 = f => a => b =>
	_use (a, a =>
		_use (b, b =>
			f (a) (b)
		)
	)

export const use3 = f => a => b => c =>
	_use (a, a =>
		_use (b, b =>
			_use (c, c =>
				f (a) (b) (c)
			)
		)
	)

export const array = use
		(array =>
			array.reduce(
				(acc, x) => use2 (acc => x => [ ...acc, x ]) (acc) (x),
				[]
			)
		)

export const object = use
	(object => {
		const keys = Object.keys(object)
		return use
			(array =>
				keys
					.reduce(
						(acc, key, index) => {
							acc[key] = array[index]
							return acc
						},
						{}
					)
			)
			(array (Object.values (object)))
	})
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

// const a = create()

// const create_b = chain(x =>
// 	console.log({ chian_x: x, bar: x.bar }) ||
// 	map (bar => console.log({ bar }) || ({ foo: bar, bar: of(0) })) (x.bar)
// )

// const b = create_b (a)

// call (console.log) (b)
// a.assign (b)

// const _foo = x => {
// 	const ref = create()
// 	x.get(ref, x => {
// 		x.bar.get(ref, console.log)
// 		ref.assign({
// 			foo: x.bar,
// 			bar: 10 //of(10)
// 		})
// 	})
// 	return ref
// }

// const foo = use (x => use (console.log) (x.bar) && ({ foo: x.bar, bar: 0 }))

// const a = create()
// const b = foo (a)

// a.assign(b)
// use (b => use (console.log) (b.foo)) (b)
// b.get(create(), b => b.foo.get(create(), console.log))

// const c = create()
// b.get(c, b => {
// 	const bar = create()
// 	b.bar.get(c, console.log)
// 	b.bar.get(c, x => bar.assign(x + 10))
// 	c.assign({
// 		foo: b.foo,
// 		bar
// 	})
// })

// const c = use
// 	(b => console.log ({ b }) || ({
// 		foo: b.foo,
// 		bar: b.bar + 10 //use (x => x + 10) (b.bar)
// 	}))
// 	(b)

// a.assign(c)
// // c.get(reference(), c => c.foo.get(reference(), console.log))
// use (c => use (console.log) (c.foo)) (c)
