import { Reference } from './Reference.js';
import { construct } from './construct.js';

// slightly more efficient than `use (f) (x)`
const _use = (x, f) => {
	if (x instanceof Reference) {
		return construct ((assign, reference) => x.get(reference, x => assign (f (x))))
	} else {
		return f (x)
	}
};

const use = f => x => _use (x, f);

export { _use, use };
