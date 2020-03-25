import { create } from './create.js'

export const fromPromise = promise => {
	const event = create()
	promise.then(event.occur)
	return event
}
