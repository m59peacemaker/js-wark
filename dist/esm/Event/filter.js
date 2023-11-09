import { filter as filter$1 } from '../Occurrences/filter.js';
import { never } from './never.js';

const filter = f => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: filter$1 (f) (x.occurrences),
				completed: x.completed
			}
};

export { filter };
