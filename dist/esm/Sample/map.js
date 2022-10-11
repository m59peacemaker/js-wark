import { construct } from './construct.js';

const map = f => x =>
	construct (
		instant =>
			f (x.run(instant))
	);

export { map };
