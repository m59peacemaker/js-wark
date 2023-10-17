import { construct } from './construct.js';

const map = f => x =>
	construct (
		instant =>
			f (x.perform(instant))
	);

export { map };
