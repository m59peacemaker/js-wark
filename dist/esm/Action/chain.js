import { join } from './join.js';
import { map } from './map.js';

const chain = f => x =>
	join (
		map (f) (x)
	);

export { chain };
