import { producer } from './producer.js'
import { once } from './once.js'

export const from_promise = promise =>
	once (
		producer (produce => promise.then(produce).catch(produce))
	)
