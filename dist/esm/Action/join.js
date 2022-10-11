import { construct } from './construct.js';

const join = action =>
	construct (
		instant =>
			action.run(instant).run(instant)
	);

export { join };
