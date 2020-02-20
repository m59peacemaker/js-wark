import { create as createEvent, of as eventOf } from './Event'
import { create as createDynamic, of as dynamicOf } from './Dynamic'

/*
	take a function and pass it event creators
	i.e. { of, create } that are wrapped so that the created events can be collected,
	then call event.actualize() on all the created events after the function runs
	so that all the statements about this moment have already been made before any are executed
	(i.e. so that subscribers have already had a chance to subscribe)
*/
const rightNow = fn => {
	const events = []
	const collectingEvent = eventCreator => (...args) => events[events.push(eventCreator(...args)) - 1]
	const eventCreators = Object
		.entries({ createEvent, eventOf, createDynamic, dynamicOf })
		.map(([ k, v ]) => [ k, collectingEvent(v) ])
		.reduce((acc, [ k, v ]) => Object.assign(acc, { [k]: v }), {})
	const result = fn(eventCreators)
	events.forEach(event => event.actualize())
	return result
}

export {
	rightNow
}
