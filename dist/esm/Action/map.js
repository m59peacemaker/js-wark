import { construct } from './construct.js';

const map = f => action =>
	construct (
		instant =>
			f (action.run(instant))
	);

export { map };
