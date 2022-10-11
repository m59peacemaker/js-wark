import { producer } from './producer.js'

export const from_promise = promise =>
	producer (produce => promise.then(produce).catch(produce))
