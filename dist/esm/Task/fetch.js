import { construct } from '../Action/construct.js';
import { producer } from '../Event/producer.js';

const fetch = ({ url, abort, ...options }) =>
	construct (() =>
		once (
			producer (
				produce =>
					globalThis.fetch(url, { ...options })
						.then(produce)
						.catch(error => error.code !== 'AbortError' && produce(error))
			)
		)
	);

export { fetch };
