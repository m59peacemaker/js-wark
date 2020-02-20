import { noop, identity } from '../utils'
import Behavior from '../Behavior'
/*
	At any exact moment in time, many things are happening, so in real life, there is a sense of event simultaneity.
	However, considering a single frame/moment of time, it would be appropriate to say that everything is in a certain state.
	The state things are in at a certain time carries semantics we summarize as "occurrence"
	Sigh, this is very difficult to define.


	If we accept as a fact that all real 'events' (whatever that means), as we perceive them, have no guarantee/relationship of simultaneity, i.e. in close proximity at best, then all real events to us will have a different `time` value... they are different 'ticks'. Then we must consider the meaning of transforming an event. A tick which is the receiving of $100, multiplied by 2, would have the same time value - the same tick, but would be the receiving of $200 at that moment.
	> I own a radio station. Every time I play the thong song by sisqo on the radio I have to make a $1 royalty payment to sisqo, $1.50 to the lyricist, and $0.50 to the beat guy, how can I  have an Event for individual transactions to feed into my stream based stripe library to make the payments?
	There is the event of starting or finishing (or having started and played the song for the required duration), which is a moment in time - a tick - which carries with it the meaning of needing to make 3 royalty payments. There is no discussion here of four moments in time, but one, with 4 semantics. Therefore, what must occur is a transformation of the value of the same tick (time value), and what must not happen is the generation of new ticks / times. Therefore, in the given example, you may just map the event to each royalty payment individually, then combine the events with a combining function that turns simultaneous events into an array, meaning the one event of playing the song has become the one event of 3 royalty payments, or map the event directly to an array of 3 royalty payments. In either case, there is a single moment of time. Now, as to the problem of the sink that expects a single request per tick, you can simply turn a tick with many values into many ticks with a single value by mapping the tick of array of values to a tick of array of Emitter.of(value), meaning that you have an emitter whose single tick generates 3 ticks. Then you must simply flatten that emitter.
*/

function Emitter (fn = noop) {
	const subscribers = new Map()
	const nextId = (n => () => ++n)(0)

	// TODO: reverse the subscriber order?
	const emit = value => Array.from(subscribers.values()).map(subscriber => subscriber(value))

	const subscribe = subscriber => {
		const id = nextId()
		subscribers.set(id, subscriber)
		return () => subscribers.delete(id)
	}

	const unsubscribeAll = () => subscribers.clear()

	const actualize = () => fn(emit)

	return Object.assign(
		function emitter (value) { emit(value) },
		{
			actualize,
			emit,
			subscribe,
			unsubscribeAll,
			constructor: Emitter
		}
	)
}

const create = Emitter

const of = (...values) => create(emit => values.forEach(emit))

// TODO: rethink this. Probably do away with the idea. A common push based protocol (i.e. Observable spec) and the transducers is the way to do this.
// turn your push based types into a type implementing Observable, transduce it, convert back to your type. You could use a helper like `Emitter.asObservable(tranduceStuff)` that takes and returns an Emitter, but converts to and from Observable to interop with the given fn
const construct = (_, fn) => create(fn) //(emitter, fn) => new ((emitter && emitter.constructor) || create)(fn)

const map = fn => emitter => {
	const mappedEmitter = construct(emitter)
	emitter.subscribe(value => mappedEmitter.emit(fn(value)))
	return mappedEmitter
}

const from = map (identity)

const scan = reducer => initialValue => emitter => {
	let acc = initialValue
	return map
		(value => {
			acc = reducer (value) (acc)
			return acc
		})
		(emitter)
}

const flatMap = fn => emitter => create(next => {
	emitter.subscribe(innerEmitter => {
		innerEmitter.subscribe(v => next(fn(v)))
	})
})

const flatten = flatMap(v => v)

const chain = flatMap

const filter = predicate => emitter => {
	const filteredEmitter = construct(emitter)
	map
		(value => {
			if (predicate(value)) {
				filteredEmitter.emit(value)
			}
		})
		(emitter)
	return filteredEmitter
}

const alt = a => b => {
	const emitter = construct(a)
	;[ a, b ].map(e => e.subscribe(emitter.emit))
	return emitter
}

const combine = emitters => emitters.reduce(
	(acc, emitter) => alt (acc) (emitter),
	construct(emitters[0])
)

const fromPromise = promise => {
	const emitter = construct()
	promise.then(emitter.emit)
	return emitter
}

const switchTo = emitter => {
	const switchingEmitter = construct(emitter)
	let unsubscribe = noop
	map
		(value => {
			const u = value.subscribe(switchingEmitter.emit)
			unsubscribe()
			unsubscribe = u
		})
		(emitter)
	return switchingEmitter
}
// switchTo = switchMap (identity) (emitter) ?

const switchMap = fn => emitter => switchTo(map (fn) (emitter))

const constant = v => map (_ => v)

const recentN = n => scan
	(v => acc => [ ...acc.slice(Math.max(0, acc.length - n + 1)), v ])
	([])

/*const BufferReady = Symbol()
const bufferTo = pipe(
	combine([ constant (BufferReady) (notifier), source ]),
	scan (({ bufferedValues }, value) =>
		BufferReady
			? ({ bufferedValues: [], result: bufferedValues })
			: ({ bufferedValues: bufferedValues.push(value) })
	),
	filter(v => 'result' in v),
	map(({ result }) => result)
)*/
	
const bufferTo = notifier => source => {
	let bufferedValues = []

	map (v => bufferedValues.push(v)) (source)

	return map
		(() => {
			const values = [ ...bufferedValues ]
			bufferedValues = []
			return values
		})
		(notifier)
}

const bufferN = n => startEvery => source => {
	return filter
		(buffer => buffer.length === n)
		(snapshot (identity) (Behavior.bufferN (n) (startEvery) (source)) (source))
}

const pairwise = bufferN (2) (1)

const snapshot = fn => behavior => emitter => map (value => fn(behavior.sample(), value)) (emitter)

export {
	alt,
	chain,
	combine,
	constant,
	create,
	filter,
	flatMap,
	flatten,
	from,
	fromPromise,
	map,
	of,
	recentN,
	scan,
	snapshot,
	switchMap,
	switchTo,
	bufferN,
	bufferTo,
	pairwise
}
