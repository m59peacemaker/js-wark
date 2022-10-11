import { construct } from './construct.js';

const apply = xf => xv =>
	construct (
		instant =>
			xf.run(instant) (xv.run(instant))
	);

export { apply };
