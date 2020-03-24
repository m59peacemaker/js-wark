import { fromPromise } from './fromPromise'
import { awaitConcurrentPromisesWith } from './awaitConcurrentPromisesWith'

export const awaitPromiseRace = awaitConcurrentPromisesWith (promises => {
	const event = fromPromise(Promise.race(promises))
	return { event, resolved: event }
})
