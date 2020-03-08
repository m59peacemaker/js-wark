export const add = a => b => a + b

export const call = fn => v => fn(v)

export const noop = () => { return }

export const identity = v => v

export const pipe = fns => v => fns.reduce((acc, f) => f(acc), v)

export const isPromise = v => typeof v.then === 'function'

export const collectValues = emitter => {
	const values = []
	const stop = emitter.subscribe(value => values.push(value))
	return Object.assign(function () { return values }, { stop })
}
