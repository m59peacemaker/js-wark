import { create as Emitter_create } from '../Emitter/index.js'
import { assignEventMetaProperties } from './assignEventMetaProperties.js'

/*
	This is shared, but always unique due to Symbol. It would not cause any difference in behavior if two instances of the library came into contact.
	The number inside the symbol arbitrary and just for debugging and testing. The library never examines it and no application should ever examine it.
	The symbol acts as a unique identifier to the propagation from a source event and is used to interact with the cache in behaviors so that the behavior can be sampled multiple times within a propagation and return the same value each time.
*/
const nextTime = (n => () => Symbol(n++))(1)

export const create = () => {
	const occurrence = Emitter_create()
	const occurrence_pending = Emitter_create()
	let t = null

	const occur = value => {
		t = nextTime()
		occurrence_pending.emit(true)
		occurrence.emit(value)
		occurrence_pending.emit(false)
	}

	function event (v) { return occur(v) }

	return assignEventMetaProperties(Object.assign(event, {
		occur,
		occurrence_pending,
		subscribe: occurrence.subscribe,
		t: () => t,
	}))
}
