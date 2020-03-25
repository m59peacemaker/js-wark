import { awaitConcurrentPromisesWith } from './awaitConcurrentPromisesWith.js'
import { fromPromise } from './fromPromise.js'

export const awaitPromiseAll = awaitConcurrentPromisesWith (promises => {
	const event = fromPromise(Promise.all(promises))
	return { event, resolved: event }
})
