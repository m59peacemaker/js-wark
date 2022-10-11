import { use } from './use.js';
import { array } from './array.js';

const object = use
	(object => {
		const keys = Object.keys(object);
		return use
			(array =>
				keys
					.reduce(
						(acc, key, index) => {
							acc[key] = array[index];
							return acc
						},
						{}
					)
			)
			(array (Object.values (object)))
	});

export { object };
