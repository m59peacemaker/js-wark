//import Emitter from '../../kweh'
import Emitter from 'better-emitter'

const Functor = ({ of, get }) => ({
	of,
	map: fn => thing => of(fn(thing.value))
})

const Applicative = ({ of, get }) => Object.assign(
	Functor({ of, get }),
	{ ap: type => type.map(get()) }
)

const Monad = ({ of, get, flatten }) => {
	const applicative = Applicative({ of, get })
	return Object.assign(
		applicative,
		{ chain: fn => flatten(applicative.map(fn)) }
	)
}

// type dependencies as array of States

State.of = value => State({ computation: () => value })

const lift = fn => states => State({ computation: fn, dependencies: states })

// TODO: maybe adjust language/api accordingly
// a state with dependencies is like a function with bind

// a state is a thing that you can ask its value any time,
// and it will give you the value at that time
// it updates

export default State

export {
	lift
}
//const sample = moment => state => Event({ state, moment })

// dependencies is an array of Moments
const Moment = ({ reducer, dependencies = [] }) => {
	const moment = State.of(0)

	const occur = () => {
		moment.set(moment.get() + 1)
		moment.emit ('occurrence') (moment.get())
	}

	dependencies.forEach(dependency => {
		dependency.on('occurrence', () => {
			// this is getting awkward
			reducer()
		})
	})

	const combine = anotherMoment => {
		const combinedMoment = Moment()
		;[ moment, anotherMoment ].forEach(moment => moment.on('occurrence', combinedMoment.occur))
		return combinedMoment
	}

	return Object.assign(
		moment,
		emitter,
		{
			occur
		}
	)
}
// is Moment.of(n) a thing? Wouldn't that imply it is a moment that has already happened `n` times?
// maybe that could at least be used in a context such as a test of the composition of a moment that is some other moment after that moment has happened n times. We could just create that n times moment from the outset. Kinda odd, though, but maybe good.

// combine moments by taking their state into a boolean whether the combined moment should occur or not

const states = [
  { value: 0 },
	{ value: 1 },
	{ value: 0 }
]

// a moment is an event whose state is the number of times it has occurred
// so there are events and state, and a moment is a type of event


// it will be good to use typescript to note whether a value is an event or a moment

// nice bonus to getting these primitives right:
// an event can occur, a moment can occur
// an event is a state at a moment, so it can occur
// I think the state of an event could not be set, though, that would be like changing history?
// gotta work out how to go from moment to event to state and such

const zip = moments => {
	// event that occurs at the given moments, with a state of an array of the occurrences of the moments.
	const occurrences = Event.lift
		(Array.of)
		(moments)
	/* alternatively, maybe:
		JS.Array.sequence
			({ of: Event.of, ap: Moment.ap, map: Moment.map })
			(moments)
  */

	const isZipOccurrence = pipe
		([
			Event.scan
				(({ minimumOccurrences, isZipOccurrence }, occurrences) => {
					isZipOccurrence = occurrences
						.every((occurence, n) => occurrence > minimumOccurrences[n])
					return {
						minimumOccurrences: isZipOccurrence ? occurrences : minimumOccurrences,
						isZipOccurrence
					}
				})
				({ minimumOccurrences: occurrences, isZipOccurrence: true })
			Event.map (({ isZipOccurrence }) => isZipOccurrence)
		])
		(ocurrences)

  // return a moment that occurs when isZipOccurrence occurs with a value of true
	return Moment.when(isZipOccurrence)


Event.when = event => Event.filter
	(value => value === true)
	(event)

// hmmmm...
Moment.when = event => Event.when(event).moment

const zipLift = fn => events => {
	const zipMoment = Moment.zip(events.map(event => event.moment))
	const state = State.lift(events.map(event => event.state))
	//const zipMoment = Event.zip(events)
	//const state = Event.lift(events)
	return state.sampleAt(zipMoment)
}

/*
 frp reduce/scan
 you can't reduce a timeless state
 you are reducing the states at times into one state
 so the resulting state doesn't need a time, but the composed state does
 it is its state at all of its times reduced to one state all the time
 it can't just be a state, as there is no notion of time with just a state alone
 and, and what we're reducing is state now with state before, so time based
 we need a given time at which to accumulate a state
 a state with a time is an event
 so we need to accumulate event values
 and form a state
 no time is needed for the result, though associating it with the same time as the subject event
 produces the typical reduce/scan behavior
 so reduce takes events (state, time) and returns a state
 when does it start accumulating, though?
 if it starts accumulating on instantiation, then it needs a stream with time delayed until you want to start accumulating
	it accumulates at the given moment
	so, if you want to delay the accumulation, then delay the moment
*/

const scan = reducer => initialValue => event => {
	let acc = initialValue
	return event
		.map(value => {
			acc = reducer(acc, eventValue)
			return acc
		})
		.state
}

const x = fn => initialValue => moments => {
	moments.forEach(
		moment => moment.on
			('occurrence')
			(() => fn(moments.map(moment => moment.index)))
	)
}


/* const Stream = value => { */
/* 	const stream = { */
/* 		value */
/* 	} */

/* 	const of = Stream.of */
/* 	const flatten = () => Stream.flatten(stream) */
/* 	const get = () => stream.value */
/* 	const set = value => { */
/* 		stream.initialized = true */
/* 		stream.value = value */
/* 		stream.emit('propagation') */
/* 	} */

/* 	return Object.assign( */
/* 		stream, */
/* 		{ */
/* 			get, */
/* 			set, */
/* 			flatten, */
/* 			end, */
/* 			toJSON: get, */
/* 			toString: () => `${stream[Symbol.toStringTag]} (${get()})`, */
/* 			[Symbol.toStringTag]: 'Stream' */
/* 		}, */
/* 		Emitter(), */
/* 		Monad({ of, get, flatten }) */
/* 	) */
/* } */

/* const isStream = value => value[Symbol.toStringTag] === 'Stream' */

/* Object.assign(Stream, { */
/* 	of: Stream, */
/* 	flatten: stream => isStream(stream.get()) ? stream.get() : stream.of(stream.get()) */
/* }) */

/* const ComputedStream = computation => { */
/* 	const stream = Stream() */

/* | let stateDependencies = [] */
/* 	let timeDependencies = [] */

/* 	const stateOf = streams => { */
/* 		return stream */
/* 	} */

/* 	const timeOf = streams => { */
/* 		return stream */
/* 	} */

/* 	return Object.assign( */
/* 		stream, */
/* 		{ */
/* 			stateOf, */
/* 			timeOf */
/* 		} */
/* 	) */
/* } */
