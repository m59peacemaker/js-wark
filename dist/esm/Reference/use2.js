import { _use } from './use.js';

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

export { use2 };
