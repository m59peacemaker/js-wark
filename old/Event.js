import Emitter from 'kweh'

const TYPE_EVENT = 'WarkEvent'

const Event = () => {
	const emitter = Emitter()

	return Object.assign(emitter, {
		[Symbol.toStringTag]: TYPE_EVENT
	})
}

const DerivedEvent = sourceEvents => {
	const event = Event()

	const on = eventName => eventHandler => {
		return sourceEvents.map(event => event.on (eventName) (eventHandler))
	}

	return Object.assign(event, {
		on
	})
}

const of = Event

const map = fn => event => {
	const mappedEvent = DerivedEvent([ event ])
	mappedEvent.on('emit', value => mappedEvent.emit(fn(value)))
	return mappedEvent
}

const combine = events => {
	const combinedEvent = DerivedEvent(events)
	events.map(Event.map (combinedEvent.emit))
	return combinedEvent
}

export default Event

export {
	of,
	map,
	combine
}

const a = Event()
a.emit(0)
const b = Event.map (add(1)) (a)
const c = Event.map (add(10)) (a)
const dState = State.lift (sum) ([ Event.memory(b), Event.memory(c) ])
const d = State.sample (dState) (Event.combine([ b, c ]))
