import { call } from '../Reference/call.js';

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

export { get };
