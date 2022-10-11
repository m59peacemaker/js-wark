import { calling } from './calling.js';

const performing = f => event =>
	calling
		(x => f (x).run (event.computed))
		(event);

export { performing };
