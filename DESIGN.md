# DESIGN

Propagation is not a stream informing dependants of the change, that then inform dependants of the change, and so on. Propagation is mapping one source value/change to one graph state.
Therefore, changes are propagated directly from the source stream introducing the change to all graph members.

## when to gather and sort dependants

Streams must propagate changes to dependants. To do so, dependants are deeply iterated to gather a flat list of streams within the stream's dependant tree, and then that list of dependants is topologically sorted.

Performing this work every time a stream changes, in the process of propagating the change, is a lot of redundant work that should be a big performance hit.

Performing this work every time there is a change in the tree of dependants is also redundant.
When combining streams into a new stream, each dependency will have a changed dependant and would collect dependants and sort them, but only once, of course.
The problem would be having multiple combines using the same dependency(ies).
The gather/sort would occur for each, even though it may be just a waste of effort but for the last change.

Instead, changes to the tree of dependants set a flag, and when the stream changes, before propagating, if the flag is set, the gather/sort will occur. So the gather/sort is lazy. This is the middle ground between the two previous options. The performance cost will be paid on the first `set` for the stream, which is also often when the stream has just been created.

## Stream

Could also be referred to as `SourceStream`
a container for a value that you can get and set
when it is set, it causes its dependencies to be computed in topological order

## ComputedStream

a stream with a computeFn and dependencies that are streams
the computeFn may or may not cause the computed stream to update
it is only the computation from its dependencies, its only responsibility
it can let dependences know it depends on them
it can compute
it should not be settable
it should have nothing to do with the propagation process

ComputedStream (computation)
computedStream.dependsOn
computedstream.endsOn


A behavior is a function of time - has a value at every moment of time
is composed with specific moments of times, which pull the behavior values at that moment (a behavior composed with specific moments of times is therefore a stream?)

maybe don't take an array of value and time streams, but only ever one stream
build merge by taking an array of streams and reducing them by combining, then use merge to build other combinators that deal with arrays
this might be a bad idea because the list of changed dependencies would be lost? but maybe it isn't needed in the hareactive way of thinking - need to research this

my computed thing / behavior, whatever, maybe can be lazy by default, meaning it is not representative of any particular times, just its computation (any times)
Then there could be the `behavior.when(stream)` function that makes it a stream by pulling the values at the times the given stream emits - the computation of the behavior at the time of the stream.
This is like hareactive's `snapshot`.

Perhaps stream is just an event emitter monad, emits occurrences  (push), { time, value }
behaviors subscribe to streams and are marked dirty on occurences and do not compute and do not emit (push). Instead, they are lazily evaluated by having their values pulled. So, the "when" of a behavior is accomplished by creating a stream of samples, which pull the behavior's value and then push it.

# Composing time

```js
const scan = fn => initialValue => stream => {
	// b1 = Behavior ((time, stream) => {}) (stream)
	// b2 = Behavior ((time, stream) => stream at time - 1?) (stream)

	return behavior // Behavior(Behavior(Stream))
}


Event()
event(value)

// contains a value that is derived from time (lazy/pull)
Behavior()

// contains a value that is dervived from time (eager/push)
Value (behavior) (stream)
stream.subscribe(() => value.emit(behavior.sample()))

const increment = Stream().map(() => 1)
const decrement = Stream().map(() => -1)
const counter = scan
	((sum, v) => sum + v)
	(0)
	(combine (increment) (decrement))
```

const stepper = initialValue => stream => {
	let value = initialValue
	stream.map(v => {
		value = v
	})
	return Behavior.of(() => v)


}

const lift = fn => behaviors => {
	const values = behaviors.map(behavior => behavior())
	return () => fn(...values)
}


However "time" is handled, it should be passed in / explicit. I'm thinking the "Event/Stream" type will represent time.

const x = Stream()
const previousX = offset (-1) (x)

const pairwise = stream => lift
	(Array.of)
	([ stepper(stream), stepper(offset (-1) (stream)) ])

const scan = reducer => initialValue => stream => {
	acc = initialValue
	return map
		(value => {
			acc = reducer(acc, value)
			return acc
		})
		(stepper (initialValue) (stream))
}

const scanBehavior = scan
  (sum)
	(0)
	(stream)

const scan = sample (scanBehavior) (stream)

values should be accumulated whenever the stream emits. If you want to accumulate later, then adjust the timing / composition of the stream accordingly
the scan behavior just accumulates the given stream from the time it is called. Simple.

// scan is a behavior of sampling something or another?

const scan = reducer => initialValue => stream => {
	acc = initialValue
	return map
		(value => {
			acc = reducer(acc, value)
			return acc
		})
		(stepper (initialValue) (stream))
}

const scan = reducer => initialValue => stream => {
	flatMap
	(value => )
	(stream)
}


reality is the state of things at times
time is a thing which is a sequential series, can be represented by an incrementing number
a piece of time is a moment
any given state corresponds to a given moment
reality is a series of where the index is a moment [ { state, moment } ]
a thing is its state over time [ stateOfThing, moment ]

every moment of a program at which any state needs to be known is associated with a real event (side-effect)
Therefore, in the context of a program, any referenced moments will be from events, so time in a program can be expressed as a series of the real events (side-effects) that occur within it.

need events, ability to transform their values and time

---
exploring the idea of using array operations on future events
considering [ a, b, c, d ] as all the events that will happen for a stream,
slice(1) would skip the first one?
slice(3, 5) would take the 3 - 5th events?
filter((v, idx) => idx % 2 === 0) skip every other event?

stream's future values: [ a, b, c, d ]
iirc:
pairwise [ [ a, b ], [ b, c ], [ c, d ] ]
partition [ [ a, b ], [ c, d ] ]


this is tricky. Nothing emits until all have emitted. After emitting, all must emit again and so on.
[ 1 ] true
[ ] false
[ 1, 2, 3, 4 ] true
[ 1 ] true
then reset
zip lift (Array.of) ([ foo, bar, baz ]) when ([])

const zip = streams => (lift (Array.of) (streams))
	.when(eachOccurs(streams))

const eachOccurs = moments => {
	// not sure what to call this at the moment
	const thisThing = reduce
	(({ minimumTimes, allOccurred }, currentTimes) => {
		const allUpdated = zip(minimumTimes, currentTimes)
			.every(([ minimumTime, currentTime ]) => currentTime > minimumTime)
		return { minimumTimes: allUpdated ? currentTimes : minimumTimes, allUpdated }
	})
	({ minimumTimes: moments.map(() => 0), allOccurred: true })
	(moments)

	return filter (({ allOccurred }) => allOccurred === true }) (thisThing)
}

---

Value, State, Behavior, Computed, Function, Memory
Time [(Moment, Instant, Frame)]
Event, Occurrence, Change [ Moment, Value ]

State
a reactive, but passive value, needs to be pulled (event)

Moment
generic units of time, indexed
Perhaps actually a type of State - an incrementing value of times occurred, so that specific moments can be composed
Moments can occur more than once
i.e. the moment the user clicks, the moment the day becomes Friday
moments are eager/pushy, when they occur, their dependants (moments composed of them) occur

Event
A Moment that has a State, should be seperatable

I am leaning toward the notion that by separating moment from state, state can be pull based / lazy, like shiz, and calculated when moments happen.

const firstNameChange = Event.of ()
const lastNameChange = Event.of ()
const firstName = State.fromEvent ('') (firstNameChange)
const lastName = State.fromEvent ('') (lastNameChange)
const fullName = State.lift (String.concat) ([ firstName, lastName ])
const fullNameChange = Event.combine ([ firstNameChange, lastNameChange ])
const fullName = X.lift (String.join (' ')) ([ firstName, lastName ])

[ Just(1), Just(2) ]
Just([ 1, 2 ])

[ [ 'a', Just(1) ], [ 'b', Just(2) ] ]
Just({ a: 1, b: 2 })

[ [ 'a', Just(1) ], [ 'b', Just(2) ] ]
[ Just([ 'a', 1 ]), Just([ 'b', 2 ]) ]
Just([ [ 'a', 1 ], [ 'b', 2 ] ])
Just({ a: 1, b: 2 })
// Event.toState Event.remember, Event.memoryState, Event.stateOfLatest, Event.toStateOfLatestValue, Event.stepper

const x = objectOfEvents => {
	const state = pipe
		([
			Object.entries,
			Array.map(([ key, event ]) => pipe
				([
					Event.toStepperState,
					State.map (value => [ key, value ])
				])
				(event)
			),
			Array.sequence (State.of),
			State.map (Object.fromEntries)
		])
		(objectOfEvents)
	return pipe
		([
			Event.combine,
			Event.mapState (state)
		])
		(Object.values(objectOfEvents))
}

const stateChange = Event.x
	({
		fullName
	})

map (render) (state)

[   0, 1, 2, 3 ]
[ 0,           1 ]

[ [ 0, 0 ], [ 1, 1 ] ]
[ [ 0, 0 ], [ 3, 1 ] ]

const eventA = Event()
const eventB = Event()
const eventC = x([ a, b ])

[ 0, 0 ]
[ 0, 1 ]

[ 1, 0 ]
[ 1, 1 ]
const isThatMoment = Event.scan
	(({ previousOccurrences, xMomentTarget }, recentOccurrences) => {
		const [ previousZipOccurrence, previousXOccurrence ] = previousOccurrences
		const [ recentZipOccurrence, recentXOccurrence ] = recentOccurrences
		const isZipOccurrence = recentZipOccurrence > previousZipOccurrence
		xMomentTarget = isZipOccurrence ? recentXOccurrence + 1 : xMomentTarget
		const isThatMoment = recentXOccurrence === xMomentTarget
		return {
			xMomentTarget,
			isThatMoment
		}
	})
	({ minimumOccurrences: occurrences, isThatMoment: true })
Event.map (({ isThatMoment }) => isThatMoment)
Event.when(isThatMoment).mapState(X)
X.when(isThatMoment)

zip
--1---2---------3--4-
----a---b---c-d------
----1a--2b------3c-4d

pairLatest
--1---2---------3--4-5---
----a---b---c-d--------e-
----1a--2b------3d-----5e

pairEarliest
--1---2---------3--4-5---
----a---b---c-d--------e-
----1a--2b------3c-----4e


zip
--1---2---------3--4-
----a---b---c-d------
----1a--2b------3c-4d
  1 1 2 2   2 2 3  4
  0 1 1 2   3 4 4  4
    x   x       x  x


pairLatest
--1---2---------3--4-5---
----a---b---c-d--------e-
----1a--2b------3d-----5e

pairEarliest
--1---2---------3--4-5---
----a---b---c-d--------e-
----1a--2b------3c-----4e
  1 1 2 2   2 2 3  4 5 5
  0 1 1 2   3 4 4  4 4 5
    x   x       x  x   x


Moment.zip
a
b
zip([ a, b ])
occurrences of both have to be greater than an incrementing index, composition of a[0] and b[0], a[1] and b[1], etc

-x---x-------x-x
---x---x-x-x----
---x---x-----x-x
 1 1 2 2 2 2 3 4
 0 1 1 2 3 4 4 4
0   1   2     3 4


Moment.x?
a
b
x([ a, b ])
occurrences of both have to be greater than they were

-x---x-------x-x-x--
---x---x-x-x-------x
---x---x-----x-----x
 1 1 2 2 2 2 3 4 5 5
 0 1 1 2 3 4 4 4 4 5
0   1   2     3     5
0   1   2     4     5


these are called "barriers"


Sample/Record
state of a thing at a time
description of that kind of thing, not an actual "one"
The real world time may have multiple occurrences, so many samples would come to be, but defining what a sample is doesn't involve any regard for there being 0, 1, or many


From Conal:
Behavior: a time varying value (what I think of as a State or just Value)
Behavior of "a" is "time" to "a"
Behavior a -> (T -> a)
Time must be infinitely divisible (real numbers, not integers)


I need to write down/define, and have examples of every kind of time/value thing I can think of

State/Value, a time varying value
const state = State.of(1)
state.get() // 1
state.set(2)
set.get() // 2
const mappedState = State.map (add(1)) (state)
mappedState.get() // 3

Event/Source (time,value) a moment (with or without a value) coming into the system

Sample
Future
When composing events, you don't want to talk about past events (like last 10), you want to talk about some future events (like the **next** 10
What if could just arbitrarily reference N Future values and use them, and the code you're working with is always that
so, even dynamically, it could be Events.futureN((incrementingIndex + 1) \* 10) (groups 0 - 9, 10-19, etc)

Promise.all([ Event.next(eventA), Event.next(eventB), Event.next(eventC) ])

Event time, index
dynamic buffering system? event records available according to what operators are using?

// You can't do anything like this, because you can't know how many records to keep upfront in all cases
[ eventA, eventB, eventC ].map(Event.record(2))

What if an event is a time varying value that pushes when it changes or something about its time matching the current time...
whose values is { time, value }

barrier
[
  { time: 187, value: 5 },
  { time: 57, value: 10 },
  { time: 543, value: 7 },
]
[
  { time: 543, value: 5 },
  { time: 543, value: 10 },
  { time: 543, value: 7 },
]

think about expressing synchronization rather than combining/deriving events?
take N events, return N events with the same time value?
then somehow turn that into something pushy...
the cool thing is that it does allow lifting event values, as they are in sync
but that also poses an interesting situation in that you could try to lift events that are not in sync..

events => {
	const latest = events
		.map(({ time }) => time)
		.sort()
		[0]
	return events.map(({ time, value }) => ({ time: latest, value }))
}

a barrier is each next event synchronized

Event.aggregate
	(aggregated => aggregated.every(event => event !== undefined))
	([ eventA, eventB, eventC ])

State { set, get }
Event { { time, value }, occur }

const scan = fn => initialValue => event => {
	let acc = initialValue
	return Event.map
		(value => {
			acc = fn(acc, value)
			return acc
		})
		(event)
}

const Counter = initialValue => ({ incrementSource, decrementSource }) => {
	const counterChanges = Event.combine([
		Event.constant (1) (incrementSource),
		Event.constant (-1) (decrementSource)
	])
	return Event.scan (add) (initialValue) (counterChanges)
}

const firstName = State.of ('')
const lastName = State.of ('')
const fullName = State.lift (join(' ')) ([ firstName, lastName ])

perhaps "Streams" or whatever atomic type have a reference back to source events, and just subscribe directly to them
So type Event can always have a reference to the source event to pass on

const a = Event()
// these keep internal reference to "a"
const b = Event.map (inc) (a)
const c = Event.map (inc) (a)
const streamB = Event.record(b)
const streamC = Event.record(c)
const streamD = Stream.lift (sum) ([ streamB, streamC ])

// streamD subscribes to the source of streamB and streamC, which is "a"
// so "a" emits, triggering b,c, updating streamB and streamC values, and then triggering streamD, which gets the latest values of B,C

pull value, push event

const a = Value()
const b = Event()
const c = Event.map (b.get()) (a)
const c = Event.withValue (b) (a)

const withValue = value => Event.map (value.get())


