import { Reference } from './Reference.js';

const get = (dependant, x, f) => {
	if (x instanceof Reference) {
		x.get(dependant, f);
	} else {
		f (x);
	}
};

export { get };
