import { producer } from './producer.js';

const from_promise = promise =>
	producer (produce => promise.then(produce).catch(produce));

export { from_promise };
