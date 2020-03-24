import { create } from './create'

export const fromPromise = promise => {
	const event = create()
	promise.then(event.occur)
	return event
}
