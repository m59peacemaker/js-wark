import { map as map$1 } from '../Occurrences/map.js';
import { never } from './never.js';

const map = f => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: map$1 (f) (x.occurrences),
				completed: x.completed
			}
};

export { map };
