import { construct } from './construct.js';

const lift3 = f => x1 => x2 => x3 =>
	construct (
		instant =>
			f
				(x1.run(instant))
				(x2.run(instant))
				(x3.run(instant))
	);

export { lift3 };
