import { snapshot as snapshot$1 } from '../Occurrences/snapshot.js';
import { never } from './never.js';

const snapshot = f => sample => x => {
	return x.completed.perform()
		?
			never
		:
			{
				occurrences: snapshot$1 (f) (sample) (x.occurrences),
				completed: x.completed
			}
};

export { snapshot };
