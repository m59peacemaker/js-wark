import { awaitConcurrentPromisesWith } from './awaitConcurrentPromisesWith.js'
import { fromPromise } from './fromPromise.js'

export const awaitPromiseRace = awaitConcurrentPromisesWith (promises => {
	const event = fromPromise(Promise.race(promises))
	return { event, resolved: event }
})
