import { call } from '../reference.js'

const uninitialized = Symbol()

// TODO: most of this can be a function of Reference, for returning the value of an already assigned reference
export const get = dynamic => {
	let value = uninitialized
	call
		(x => value = x)
		(dynamic)
	if (value === uninitialized) {
		// TODO: custom error?
		throw new Error('Attempted Dynamic.get on a reference that has not been assigned')
	}
	return value.run(Symbol())
}
