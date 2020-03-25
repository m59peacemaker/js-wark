import { awaitConcurrentPromisesWith } from './awaitConcurrentPromisesWith.js'
import { fromPromise } from './fromPromise.js'
import { ordered } from './ordered.js'

export const awaitPromiseOrdered = awaitConcurrentPromisesWith (promises => {
	const events = promises.map(fromPromise)
	return { event: ordered(events), resolved: events[events.length - 1] }
})
