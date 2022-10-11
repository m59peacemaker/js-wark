import { forward_referencing } from '../Reference/forward_referencing.js';
import { hold } from './hold.js';
import { snapshot } from './snapshot.js';

const scan = f => initial_value => event =>
	forward_referencing (x =>
		hold
			(initial_value)
			(snapshot (f) (x) (event))
	);

export { scan };
