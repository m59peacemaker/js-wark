import { construct } from './construct.js';

const lift2 = f => x1 => x2 =>
	construct (
		instant =>
			f
				(x1.run(instant))
				(x2.run(instant))
	);

export { lift2 };
