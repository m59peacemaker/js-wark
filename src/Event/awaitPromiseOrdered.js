import { fromPromise } from './fromPromise'
import { ordered } from './ordered'
import { awaitConcurrentPromisesWith } from './awaitConcurrentPromisesWith'

export const awaitPromiseOrdered = awaitConcurrentPromisesWith (promises => {
	const events = promises.map(fromPromise)
	return { event: ordered(events), resolved: events[events.length - 1] }
})
