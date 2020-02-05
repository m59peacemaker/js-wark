const noop = () => { return }

const identity = v => v

const pipe = fns => fns.reduce((acc, fn) => v => acc(fn(v)))

const add = a => b => a + b

const isPromise = v => typeof v.then === 'function'

export {
	noop,
	identity,
	pipe,
	add,
	isPromise
}
