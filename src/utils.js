const call = (fn, v) => fn(v)

const noop = () => { return }

const identity = v => v

const pipe = fns => fns.reduce((acc, fn) => v => acc(fn(v)))

const add = a => b => a + b

const isPromise = v => typeof v.then === 'function'

const valuesOf = emitter => {
	const values = []
	emitter.subscribe(value => values.push(value))
	return () => values
}

export {
	add,
	call,
	identity,
	isPromise,
	noop,
	pipe,
	valuesOf
}
