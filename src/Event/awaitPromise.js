import { create } from './create'

// occurs with the value of each promise, when each promise resolves (occurs in order of resolution, not order received)
export const awaitPromise = eventOfPromise => {
	const event = create()
	eventOfPromise.subscribe(promise => promise.then(event.occur))
	return event
}
