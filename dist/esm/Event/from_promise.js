import { producer } from './producer.js';
import { once } from './once.js';

const from_promise = promise =>
	once (
		producer (produce => promise.then(produce).catch(produce))
	);

export { from_promise };
