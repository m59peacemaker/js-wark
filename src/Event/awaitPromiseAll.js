import { fromPromise } from './fromPromise'
import { awaitConcurrentPromisesWith } from './awaitConcurrentPromisesWith'

export const awaitPromiseAll = awaitConcurrentPromisesWith (promises => {
	const event = fromPromise(Promise.all(promises))
	return { event, resolved: event }
})
