# wark

> avoid pain and suffering and fly around on a chocobo or something

![Wark!](https://user-images.githubusercontent.com/4369247/33407500-42f7d608-d537-11e7-9754-1ef262f9d6ad.png)

## Status

**0.0.0-pre-alpha-insanity-wolf**

## Table of Contents

- [Why?](#Why)
- [Goals](#goals)
- [Install](#install)
- [Quick Start](#quick-start)
- [API](#API)
- [Concepts](#concepts)
- [Comparing approaches to reactive programming](#comparing-approaches-to-reactive-programming)

## Why?

Coordinating events and values that change with code is often an unwieldy, intellectually-painful task for a human. We should prefer to tell machines to do it for us with words we would use among friends... albeit technical, pedantic friends.

These fancy human words should have qualities that let them roll off the tongue for hours without causing us to go mute at some point. I was trying to get to the point that we want to avoid complexity walls, but my analogy didn't work out. HELP WANTED: good analogy.

Let's look at some expressions of the same goal - a simple counter.

I will start with words, stating what I believe this counter **is**, making no consideration of how it should be written as code.

- The counter is the accumulation across time of changes to the counter value, which is initially 0.
- By "accumulation", I mean taking each change and adding it to the counter value at the time of the change.
- By "change", I mean that there is an "increment" event and there is a "decrement" event.
- Each occurrence of "increment" should mean +1
- Each occurrence of "decrement" should mean -1

Here is how you would start to make a counter in many approaches:

```js
let count = 0
```

Well, that was underwhelming! You could say we learned 'zero' about what a counter is.

Next is an approach using a currently popular style of state management, and represents a paradigm found through many libraries and frameworks:

```js
const [count, dispatch] = useReducer(
	(count, event) => add(count, { increment: 1, decrement: -1 }[event]),
	0
)
```

There is certainly more information here - I would even say it does fully define the counter, and we are able to gain a more complete understanding of this expression by reading it alone. These are good things.

However, there are issues. Words such as `dispatch` and `useReducer` may be things that you know how to use in this context, but they don't mean anything otherwise. I urge you to consider whether, when asked what a counter is, and remembering that you must be thoroughly accurate and technical, if any answer you'd ever give would say something like `useReducer` or `dispatch`. Moreover, consider how you could define what `useReducer` and `dispatch` mean, without saying something about how to write code using them.

Issues of meaning and grammar aside, the greatest failure in this approach is that `dispatch` is on the left hand side, but affects the behavior of the right hand side - the composition that created it. `dispatch` is sent out into the world to implicitly affect the expression it is derived from, whereas functional compositionality requires that it be a value explicity passed into the expression. The occurrences of "increment" and "decrement" are implicit. There is no expression in this approach that refers to their actual occurrence. Consider something like a promise or an emitter. Those are examples of values that can represent something like "occurrence".

Here is how the counter is expressed using the functional reactive style of this library:

```js
const count = accumulateFrom (0) (concatAll ([ constant (1) (increment), constant (-1) (decrement) ]))
```

This is code derived from the words describing the goal and can be read similarly:

"Count is the accumulation from 0, the (combination) of: increment being 1 and decrement being -1"

Grammar aside - what I hope will come to be appreciated is that every word - **every expression** - is a value that can removed, replaced, passed around, and composed on, **independently** of every other value, anywhere, and all compositions can be understood according to their inputs and nothing else.

Using understandable, meaningful grammar with composable semantics, and obeying the principle of [compositionality](#compositionality) is paramount for preventing ballooning complexity.

### compositionality

Compositionality is the principle that the meaning of an expression is determined by the meanings of its constituent expressions and the rules used to combine them.

## Goals

- simple, practical, and accurate grammar for the expression of event, reactive value, and computation relationships
- minimal implementation code so that the frp library can be depended on by UI components and other reusable modules where saving bytes is a priority
- performant enough for most use cases, including complex DOM UIs, games, webgl, canvas, etc
- slight allowance of increased byte size and less-comprehensible internal implementation if truly necessary for dramatic performance gains.

My opinion is that accurate, expressive code can also be performant code in many cases. *Considerable work ***may*** need to done in the implementation to accomplish this - performance has not yet been measured and explored.*

## TODO

- more operators are needed asap, especially related to performing async functions
- Typescript in jsdoc
- settle on an api/strategy for deriving new moments of time from a single moment  - i.e. Occurrence(List) into List(Occurrence)
- examples for common real-life situations
- probably document Emitter
- performance benchmarking and optimization

## Install

```sh
npm install wark
```

## Quick Start

Here's a simple counter. The idea is that the counter is the result of folding (aka reducing) an event of changes, which are either the number 1 or -1, by adding them to the current value, starting from 0.

```js
import { Event, Behavior, Dynamic } from 'wark'
import { add } from 'ramda'

const increment = Event.create()
const decrement = Event.create()

const countChanges = Event.concatAll ([ Event.constant (1) (increment), Event.constant (-1) (decrement) ])
const count = Dynamic.fold (add) (0) (countChanges)
```

Explained:

```js
import { Event, Behavior, Dynamic } from 'wark'
import { add } from 'ramda'

const increment = Event.create()
const decrement = Event.create()

// combine the events of counter changes
const countChanges = Event.concatAll ([
	// make an event from `increment` whose value is always 1
	Event.constant (1) (increment),
	// make an event from `increment` whose value is always -1
	Event.constant (-1) (decrement)
])
// fold the countChanges across time by adding them to the current value
const count = Dynamic.fold (add) (0) (countChanges)

// called immediately with the current value (0) and when the value is updated
count.subscribe(console.log)

// called only when the value is updated
count.updates.subscribe(console.lg)

count.sample() // 0
increment.occur()
count.sample() // 1
increment.occur()
count.sample() // 2
decrement.occur()
count.sample() // 1
```

Here's a more complex counter. The idea is that the counter is the result of folding an event of change functions by calling the function with the current value. This example adds levels of difficulty over the simple counter. It has a `reset` event, which doesn't work with the idea of `fold (add)`, because reset is 'become 0' not just 'add 0 to the current value'. It also has a reactive value that is changed by an event, changed independently of counter changes, but whose value is needed to calculate a counter change event's function.

```js
import { Event, Behavior, Dynamic } from 'wark'
import { add, compose } from 'ramda'

const increment = Event.create()
const decrement = Event.create()
const reset = Event.create()
const minimumChange = Event.create()

const minimum = Dynamic.hold (-Infinity) (minimumChange)

const counterOperations = compose
	(
		Event.snapshot ((minimum => operation) => v => Math.max(minimum, operation(v))) (minimum),
		Event.concatAll
	)
	([
		Event.constant (always(0)) (reset))
		Event.constant (add(1)) (increment),
		Event.constant (add(-1)) (decrement),
	])
const count = Dynamic.fold (call) (0) (counterOperations)
```

Explained:

```js
import { Event, Behavior, Dynamic } from 'wark'
import { add, compose } from 'ramda'

const increment = Event.create()
const decrement = Event.create()
const reset = Event.create()
// this event should occur with a number that is to limit how low the counter value can be
const minimumChange = Event.create()

// Turn the event into a dynamic (reactive value) whose value starts as the given value
// and updates with the event value.
// `hold` holds onto the value from the event so that we can use it in compositions
// that occur at other times.
const minimum = Dynamic.hold (-Infinity) (minimumChange)

const counterOperations = compose // (read this from the bottom up)
	(
		// snapshot lets you associate a reactive value with an event.
		// The function gets the dynamic's value, the event occurrence value,
		// and returns a new value for the occurrence.
		// Here, out function receives the current value of `minimum`, the event's value,
		// which is an operation to apply to the the counter,
		// and we return a function to apply to the counter that wraps the counter operation
		// to limit it to `minimum`.
		Event.snapshot (minimum => operation => v => Math.max(minimum, operation(v))) (minimum),
		// combine an array of events into a single event that occurs when one of the events occur
		Event.concatAll
	)
	([
		// Make an event from `increment` whose occurrence value
		// is always a function that adds 1 to its input.
		Event.constant (add(1)) (increment),
		// Make an event from `decreremt` whose occurrence value
		// is always a function that adds -1 to its input.
		Event.constant (add(-1)) (decrement),
	])

const count = Dynamic.fold (call) (0) (counterOperations)
```

## API

Functions will be documented from lower level to higher level unless inapplicable or for some reason impractical. This means you can read from the start of each section downward to best understand the higher level grammar and more convenient and useful functions, or start from the end of a section for functions that you may use more often.

### Event

An Event represents a list of occurrences across time. Just as you may have an array of values right now, such as `[ 1, 2, 3 ]`, you may have a user clicking a button at some times, and if you were to listen for that event and put its occurrence values into an array, it would look like this:

```js
// when the app starts
const clicks = []

// later, the user clicks the button
clicks // [ click ]

// later, the user clicks the button again
clicks // [ click, click ]

// later, the user clicks the button again
clicks // [ click, click, click ]
```

The above example refers to the idea of an Event being a list across time, but has no grammar for directly expressing and composing with it. In the same way that a `Promise` provides a reference to the idea of "a value later" that you can compose with now, `Event` provides a reference to the idea of "possibly an occurrence later, and again later, and again later" and so on, and you can compose that idea into other reactive ideas, such as keeping up with how many times the user has clicked the button. You may think of an Event as an emitter emitting values, but with some improved semantics for composition, and we prefer to talk of `occurrence` rather than `emit` because it accords with the higher level meaning of the application and not with the lower level implementation details.

##### `Event.create`

`Event.create()`

This creates an event object that you can you use to push values out to subscribers and more commonly, through reactive expressions composed from it.

The event created here could more specifically be known as a *Source Event* - as its `.occur()` function introduces an occurrence to the expressions composed from it, whereas events composed from other events do not have this function. Events composed from other events are *Derived Events*.

##### `event.occur`

`event.occur(occurrenceValue)`

This is the equivalent on emitters of `emit`. It introduces a moment of time into the reactive graph you've composed from this event, sending the occurrence value along. In some cases the occurrence value would intuitively be called a *description* of the event occurrence and other times it is a more arbitrary seeming value, such as a number, if any value at all. *Occurrence value*, or just *value* for short, seems a good term to use in general, though I still find *occurrence description* and *occurrence information* to be worth mentioning.

##### `event.subscribe`

`event.subscribe(occurrenceValue => {})`

Any event may be subscribed to, and the given subscriber function will be called with the occurrence value of the event when it occurs.

##### `event.t`

`event.t()`

This is a property of event bound to confuse some and anger other folks. It exists for some purposes of practicality and possibly is not needed other than for debugging, testing, and internal implementation details.

*Caution: low-level, possibly dangerous, possibly irrelevant stuff ahead.*

The value returned from `event.t()` is a Symbol. When a source event occurs, it creates a new Symbol, stores it internally, and all compositions resulting from also update their internal `t` value to the `t` value from the source event *if* they occur at that moment. This means that for every source occurrence, there is a single, unique value for `t` that is shared by every event that occurred from that source occurrence. `event.t()` returns that value, so in a sense, it acts as a timestamp (albeit arbitrary) for events.

This unique `t` serves one purpose for the functionality of the library - it is used to bust a behavior's cache when its value is checked at a different time, so that the behavior's computation will run again. To say it another way - Behaviors have (and conceptually are) a function that takes time (our arbitrary `t`) and returns a value for that time. Internally, the behavior keeps a cache of the latest return value from its function and the value of `t` when it called that function, and so long as it keeps getting the same `t`, it returns the cached value. When it gets a different `t`, the function is called, and the result is cached.

Again, you probably never need to and should never directly deal with `event.t()`, except for testing or debugging. If you do, then realize it is possible to pass a semantically insane `t` value to a behavior's sample function, and at least cause unnecessary computation, if not much worse things such as inconsistent values for things sampling the behavior in the same moment.

Up to this point, the `t` value has been discussed only in terms of how it operates within the library - a topic in which we only care that `t` is a Symbol and so always unique. The library never examines the description value of the Symbol in anyway, as no internal or application code should. But, it can be useful for testing and debugging to know that the description value of `t` is a number, and all source event occurrences get this number from the same incrementing source. Therefore, in **most** cases, this number is the global index of source occurrences - if `t` is a timestamp, then you could say each source occurrence gets its `t` by checking a shared clock. You must **never, ever, everest** depend on this value for some kind of application semantics. It's a totally arbitrary incrementing index that can't actually mean something to your application, as it is relative to unrelated events occurring. Moreover, it is possible that this library could be bundled into some module used in application code where this library is also used, and so two instances of it appear in the same application, and should that module expose any of this libraries reactive values, they could be composed together such that the number inside of the `t` value does not even reliably increment. The library will work fine because it only cares that a unique Symbol is passed around appropriately, but should you depend on the number inside of the `t` Symbol, and this scenario should come about, your application **will** break and I shudder to think of how nigh impossible it will be to discover the cause. **Do not depend on the description value of the `t` Symbol.** But for tests, it could be cool to form assertions such as "at `t` `0`, `fooEvent` occurred with a value of `'foo'`" and such.

Feel free to help improve the library to do this (and anything else) better.

#### Basics

This is a wrong, but possible use of an Event that treats it like a common and not powerful emitter, for the sake of demonstration:

```js
const click = Event.create()
const clicks = []
click.susbcribe(occurrenceValue => clicks.push(occurrenceValue))
click.occur('click1')
clicks // [ 'click1' ]
click.occur('click2')
clicks // [ 'click1', 'click2' ]
click.occur('click3')
clicks // [ 'click1', 'click2', 'click3' ]
```

The appropriate way to accomplish the above is to compose the event into a Dynamic (a reactive value) that can hold onto the event values:

```js
const click = Event.create()
// fold (aka reduce) the event (list) across time
const clicks = Dynamic.fold (click => acc => [ ...acc, click ]) ([ ]) (click)

// called immediately with the current value of []
// and called on each occurrence of click with the updated value i.e. [ 'click1' ]
clicks.subscribe(console.log)

// same as subscribing directly to the dynamic (as above),
// except without the initial call with the current value of the dynamic
clicks.updates.console.log)

click.occur('click1')

It is also possible to check the value of a dynamic any time:
clicks.sample() // [ 'click1' ]

click.occur('click2')
clicks.sample() // [ 'click1', 'click2' ]

click.occur('click3')
clicks.sample() // [ 'click1', 'click3' ]
```

#### Event.never

`Event.never()`

Creates an event that never occurs.

```js
const functionThatRequiresAnEvent = event => {
	foo()
	event.subscribe(bar) // this function must have an event to subscribe to
	return baz()
}
// but we don't actually have an event to give it and don't want to
functionThatRequiresAnEvent(Event.never())
```

#### `Event.forwardReference`

`Event.forwardReference()`

Returns a value that can be used as an event, before actually assigning it a value. This is useful for cases where the event you'd like to pass to something has not yet been created. When that event is available, call `forwardReference.assign(thatEvent)` to set the forward reference's real value.

```js
// pointless example for the sake of a concise demonstration
const forwardReference = Event.forwardReference()
forwardReference.subscribe(console.log)

const eventPlusOne = Event.map (add(1)) (forwardReference)
eventPlusOne.subscribe(console.log)

const event = Event.create()
forwardReference.assign(event)

event.occur(1)
// -> logs 1
// -> logs 2
```

`forwardReference.assign(event)` returns the given event for convenience and readability. The previous example could have been written like this:

```js
const event = forwardReference.assign(Event.create())
```


#### Combining

##### `Event.combineAllWith`

`Event.combineAllWith (occurrences => combinedValue) ([ ...events ])`

This is the lowest level and least convenient way to combine events, but provides the most information and compositional possibilities. All other combining functions are derived from this. It takes a function and an array of events. The function receives an object desciribng what has occurred. The object keys correspond to the index of the events as given in the input array. If the event occurred at this moment, its index will be a key on the object, with its occurrence value as the value for that key. This allows you to examine the object to determine whether/what events occurred at the moment with what values and produce a single value for the combined event. If this is very confusing, you may want to refer back to the section about [event simultaneity](#event-simultaneity).

```js
Event.combineAllWith
	(o => {
		o.hasOwnProperty(0) // true if eventA occurred
		o.hasOwnProperty(1) // true if eventB occurred
		o.hasOwnProperty(2) // true if eventC occurred
		o[0] // value of eventA if it occurred
		o[1] // value of eventB if it occurred
		o[2] // value of eventC if it occurred
		return Object.values(o) // just returning an array of all occurrences values
	})
	([ eventA, eventB, eventC ])
```

Do not assume that `o[0] === undefined` means the first given event did not occur - the event may have just occurred with the value `undefined`, so the object looks like `{ 0: undefined }` (not considering any other events that may have occurred simultaneously and would therefore have properties on the object as well). You must check whether the object has key `0` to know whether the event given at `0` occurred.

##### `Event.combineKeyedWith`

`Event.combineKeyedWith (occurrences => combinedValue) ({ ...events })`

Like [`Event.combineAllWith`](#EventCombineAllWith), but takes an object of events, and passes an object of occurrences to the given function, where **occurrences of an event have the same key as the event in the input object**.

```js
Event.combineKeyedWith
	(o => {
		o.hasOwnProperty('eventA') true if eventA occurred
		o.eventA // value of eventA if it occurred
		// etc (see combineAllWith)
	})
	({ eventA, eventB, eventC })
```

##### `Event.combineKeyed`

`Event.combineKeyed ({ ...events })`

Convenience for [`Event.combineKeyedWith`](#EventCombineKeyedWith)`(identity)`.

```js
Event
	.combineKeyed ({ eventA, eventB, eventC })
	.subscribe(value => {
		// indicates that eventA and eventC occurred simultaneously with values 'foo' and 'bar'
		value // { eventA: 'foo', eventC: 'bar' }
	})
```

##### `Event.concatWith`

`Event.combine (whenA) (whenB) (whenAB) (a) (b)`

Combine two events using a function to determine the combined occurrence value for each possible scenario of event simultaneity.
`whenA` will be used when event `a` occurs and event `b` does not. `(a => occurrenceValue)`
`whenB` will be used when event `a` occurs and event `b` does not. `(b => occurrenceValue)`
`whenAB` will be used when event `a` and event `b` occur simultaneously. `(a => b => occurrenceValue)`

```js
Event.combine
	(aValue => aValue + 1) // when `eventA` occurs and `eventB` does not
	(bValue => bValue + 2) // when `eventB` occurs and `eventA` does not
	(aValue => bValue => aValue + bValue) // when both events occur simultaneously
	(eventA)
	(eventB)
```

##### `Event.concat`

`Event.concat (a) (b)`

`Event.concat` simply combines the given events and will throw an error if they ever occur simultaneously. This provides a way to combine events that is semantically comparable to concat on lists, as an event is a list of occurrences across time, except for when events occur simultaneously, in which case the value of the event is a list of simultaenous occurrences, rather than the typical value just being a single occurrence. It is generally good to be able to compose events (or anything) without having to know the expressions that created them, for example, if you had an event `timeToEatLunch`, it has enough meaning on its own for you to compose it into the eating of a delicious sandwich without needing to know how `timeToEatLunch` came to be. Therefore, it is preferable when combining events if you don't need to know whether they may occur simultaneously, but that also means you can't truly acheive semantic parity with lists/arrays. The idea here is that you can attempt to concat events as though they will always be simply lists of occurrence, and should they in fact ever be the other type - lists of list of simultaneous occurrences, then an error will be thrown and you will discover that the events you used are not compatible with this operator. It's a bit awkward, but seems a reasonable compromise for the sake of being able to operate generically on events as lists.

TODO: Further discuss list across time of a list of simultaenous occurrences vs list across time of occurrence somewhere in the docs, in improve the wording (and length, phew) above.

##### `Event.concatAll`

`Event.concatAll ([ ...events ])`

`Event.concat` but takes an array of events to combine.

##### `Event.combineAllByLeftmost`

`Event.combineAllByLeftmost ([ ...events ])`

Lazy, practical description:
Use this when you want to combine events and don't care about the occurence value or are fine with the occurrence value being based on the order the events are given in the input array.

Less fun technical description:
Combines events such that the resulting event will have the occurrence value of the occurrence appearing first in the list of simultaneous occurrences, which are ordered the same as the input array.

`Event.combineByLeftmost ([ eventA, eventB, eventC ])` will occur with the occurrence value of `eventA` if `eventA` occurs, disregarding any simultaneous occurrence of `eventB` and/or `eventC`. Similarly, if `eventA` did not occur and `eventB` did occur, then the value of `eventB` will be used. And lastly, if neither `eventA` or `eventB` occurred, then the occurrence value of `eventC` will be used when it occurs.

##### `Event.combineByLeftmost`

`Event.combineByLeftmost (a) (b)`

[`Event.combineAllByLeftmost`](#EventCombineAllByLeftMost) but takes an event and another event instead of an array of events.

#### Transforming

##### `Event.map`

`Event.map (a => b) (event)`

Takes a function and an event and returns an event whose occurrence value is transformed by the given function.

```js
const numberEvent = Event.create()
const doubledEvent = Event.map (v => v * 2) (numberEvent)
numberEvent.occur(2) // doubledEvent occurs with a value of 4
```

##### `Event.constant`

`Event.constant (value) (event)`

Takes an event and returns an event whose occurence value is always the given value.

```js
const fooEvent = Event.create()
const barEvent = Event.map ('bar') (fooEvent)
fooEvent.occur('foo') // barEvent occurs with value 'bar'
fooEvent.occur('whatever') // barEvent occurs with value 'bar'
```

##### `Event.filter`

`Event.filter (predicate) (event)`

Takes an event and returns an event that will not occur unless the occurence value of the given event passes the predicate function.

```js
const numberEvent = Event.create()
const evenNumberEvent = Event.filter (v => v % 2 === 0) (numberEvent)
numberEvent.occur(2) // evenNumberEvent occurs with value of 2
numberEvent.occur(3) // evenNumberEvent does not occur
```


#### Flattening

Flattening functions are for the case that the occurence value of an event is itself an event. In the same way that an array may contain values which are also arrays and you may flatten such an array to move the inner array values out as direct values of the outer array, you may flatten an event into a new event that occurs when the otherwise nested events occur.

The reason such composition is helpful and necessary is that it means reactive compositions can themselves be reactively created and used and switched out - reactive expressions can construct reactive expressions reactively.

##### `Event.switchMap`

`Event.switchMap (v => event) (event)`

`Event.switcMap` takes a function and an event, and like `Event.map`, passes the function the occurrence value of the input event. The function must return an event. The resulting event will occur with the occurrences of the event returned from the function, always switching to the returned event each time the input event occurs.

```js
const a = Event.create()
const b = Event.create()
const someEvents = { a, b }
const eventSelectedByName = Event.create()
const selectedEvent = Event.switchMap (eventName => someEvents[eventName]) (eventSelectedByName)

eventSelectedByName.occur('b')
a.occur(1)
b.occur(1) // selectedEvent occurs with a value of 1
eventSelectedByName.occur('a')
a.occur(5) // selectedEvent occurs with a value of 5
b.occur(7)
a.occur(4) // selectedEvent occurs with a value of 4
```

##### `Event.switchLatest`

`Event.switchLatest (event)`

Convenience function for `switchMap (identity)`. It would be simply called `switch`, but that is a reserved word in JavaScript. `swoosh`, `sandwich`, and `$witch` were considered.

```js
const a = Event.create()
const b = Event.create()
const eventSelected = Event.create()
const selectedEvent = Event.switchLatest (eventSelected)

eventSelected.occur(b)
a.occur(1)
b.occur(1) // selectedEvent occurs with a value of 1
eventSelected.occur(a)
a.occur(5) // selectedEvent occurs with a value of 5
b.occur(7)
a.occur(4) // selectedEvent occurs with a value of 4
```

#### Composing with Behaviors

##### `Event.snapshot`

`Event.snapshot (behaviorValue => occurrenceValue => newOccurrenceValue) (behavior) (event)`

This is the lowest level way that you should associate a behavior's value with an event occurrence. Snapshot means deriving an event from a behavior at the time of a given event.
Takes a function, a behavior, and an event, and returns an event that occurs when the input event occurs. The given behavior's current value and the given event's occurrence value are passed to the function and it returns the occurrence value for the derived event.

```js
const randomInt = Behavior.create(() => randomInt(0, 5))
const keyEvent = Event.create()
const snapshotEvent = Event.snapshot (int => key => ({ [key]: int })) (randomInt) (keyEvent)
keyEvent.occur('foo')
// for the sake of demonstration, let's sample randomInt at the same time that keyEvent just occurred
randomInt.sample(keyEvent.t()) // 3
// so when keyEvent occured, snapshotEvent occurred with a value of { foo: 3 }
```

##### `Event.attach`

`Event.attach (behavior) (event)`

This is a convenience for snapshotting a behavior using a function that returns the event occurrence value and the behavior value in an array.

```js
const randomInt = Behavior.create(() => randomInt(0, 5))
const keyEvent = Event.create()
const attachEvent = Event.attach (randomInt) (keyEvent)
randomInt.sample(keyEvent.t()) // 3
keyEvent.occur('foo') // attachEvent occurs with [ 'foo', 3 ]
```

##### `Event.tag`

`Event.tag (behavior) (event)`

This is a convenience for snapshotting a behavior using a function that just returns the behavior's value. In other words, it takes an event and a behavior and makes an event that occurs with the value of the behavior.

```js
const randomInt = Behavior.create(() => randomInt(0, 5))
const keyEvent = Event.create()
const tagEvent = Event.tag (randomInt) (keyEvent)
randomInt.sample(keyEvent.t()) // 3
keyEvent.occur('foo') // tagEvent occurs with 3
```

### Behavior

#### conceptually

A Behavior is a function across time; simply `currentTime => valueForTheCurrentTime`. Because you call a function at some time, you can think of the function call as the "time" and so the function is `() => valueForTheCurrentTime`; a function that returns a changing value. However, if it were possible to call this function twice at the exact same time (as in [event simultaneity](#event-simultaneity)) the result must be the same, because the time is the same, and a behavior is a function from time to value at that time. A behaviors samples at the same time must have the same value.

#### practically

It could be helpful to think of a behavior as a pull-based value, whereas an event occurrence is push-based.

Behaviors are used to model [*continuous time*](#continuous-time) or *resolution-independent* values. Read more: [Why program with continuous time?](http://conal.net/blog/posts/why-program-with-continuous-time). At some point (aka time) such a value has to be sampled; the result being a time/resolution dependent value. In the event-relative-time world of FRP, any time that you would sample a behavior is the time of an event occurrence, so use a behavior, at some point, you will take an event and a behavior and create an event that samples and occurs with the behavior value (or something derived from it). See [`snapshot`](#snapshot).

A Behavior is just a type for composing an impure function call that operates efficiently and consistently within the FRP system. For example, if you create a behavior based on `Math.random` and its value is checked multiple times within a moment (propagation from an `event.occur`), the behavior will be passed the same unique value each time it is checked, so that its value can be cached and reused within that moment.

```
a = randomInt(0, 5)
b = a
c = a + 1
d = a - 1

a # 3
b # 3
c # 4 (3 + 1)
d # 2 (3 - 1)
```

Without behavior computation caching, the computation would run each time the value is checked, potentially producing a different value for dependants in the same moment.

```
a # 3
b # 5
c # 2 (1 + 1)
d # 1 (2 - 1)
```

Behaviors integrate with the frp system to avoid this kind of inconsistency.

#### `Behavior.create`

`Behavior.create(() => value)`

Just put your time-varying function here and get a behavior.

#### `Behavior.sample`

`Behavior.sample(t)`

You may want to learn about the `t` value that can be used in `sample(t)`, which is detailed under [`event.t()`](#eventT). Otherwise, don't worry about it and things will *probably* be ok. Just avoid directly calling `sample()`.

```js
// high level stuff
// make a behavior of Math.random and compose events and dynamics with it
const random = Behavior.create(Math.random)
const someEvent = Event.create()
const eventOfRandom = Event.tag (random) (someEvent)
const discreteRandom = Dynamic.hold (random.sample()) (eventOfRandom)

// low level stuff
random.sample() === discreteRandom.sample() // true

random.sample(Symbol()) // tells the behavior time has moved forward

// false, because eventOfRandom did not occur and cause discreteRandom to update
random.sample() === discreteRandom.sample()

someEvent.occur()

// true because these all just occurred at the same time
someEvent.t() === eventOfRandom.t() === discreteRandom.t()

// true because someEvent.occur caused time to move forward
// and discreteRandom updated at that time
random.sample() === discreteRandom.sample()
```

#### `Behavior.constant`

`Behavior.constant (value)`

Creates a behaviors whose value is always the same.

```js
const three = Behavior.constant(3)

three.sample(now) // 3
three.sample(tonight) // 3
three.sample(tomorrow) // 3
three.sample(oneEternityLater) // 3
```

#### `Behavior.map`

`Behavior.map (a => b) (behavior)`

Takes a function and a behavior and returns a behavior whose value is transformed by the given function.

```js
const n = Behavior.constant(2)
const doubleN = Behavior.map (v => v * 2) (n)
n.sample() 2
doubleN.sample() 4
```

#### `Behavior.lift`

`Behavior.lift ((...values) => result) ([ ...behaviors ])`

Takes an nAry function and an array of behaviors and returns a behavior whose value is the result of the function called with the values of the input behaviors.

```js
const nA = Behavior.constant(2)
const nB = Behavior.constant(3)
const nC = Behavior.lift ((a, b) => a + b) ([ nA, nB ])
nC.sample() // 5
```

#### `Behavior.lift2`

`Behavior.lift2 (a => b => c) (a) (b)`

Like [`Behavior.lift`](#Behavior.lift), but takes two behaviors one at a time and passes them to the function one at a time.

```js
const nA = Behavior.constant(2)
const nB = Behavior.constant(3)
const nC = Behavior.lift2 (a => b => a + b) (nA) (nB)
nC.sample() // 5
```

#### `Behavior.apply`

`Behavior.apply (behavior_of_function) (behavior_of_value)`

Takes a behavior whose value is a function and another behavior and calls the function from the first behavior with the value of the second behavior.

```js
const filterEven = Behavior.constant(array => array.filter(v => v % 2 === 0))
const arrayOfNumbers = Behavior.constant([ 1, 2, 3, 4, 5 ])
const arrayOfEvenNumbers = Behavior.apply (filterEven) (arrayOfNumbers)
arrayOfEventNumbers.sample() // [ 2, 4 ]
```

#### `Behavior.chain`

`Behavior.chain (value => behavior) (behavior)`

Takes a function and a behavior, where the function takes the value from that behavior and returns a behavior, and returns a behavior that has the value of the behavior returned from the function.
It may be easiest to understand this by imagining the scenario that the input behavior's value is also a behavior, and the function just returns that inner behavior, and the result is a behavior with the value of that inner behavior, so `Behavior(Behavior(3))` becomes `Behavior(3)`. This is the behavior equivalent of `flatMap` on arrays.

```js
const b3 = Behavior.constant(3)
const bb3 = Behavior.constant(b3) // Behavior(Behavior(3))
const b3Again = Behavior.chain (v => v) (bb3)
b3.sample === b3Again.sample() // true
```

#### `Behavior.forwardReference`

`Behavior.forwardReference()`

Like [`Event.forwardReference`](#EventForwardReference), but for a behavior and must be assigned a behavior.

### Dynamic

A dynamic is a behavior that changes discretely with an event of its updates. It can be practical to think of it as an event with memory, though it would be more appropriate to think of a Dynamic as a reactive value. A `first_name_update` is an event, while a `first_name` is a reactive value and so should be modeled as a Dynamic. You can pass a dynamic to a function that takes a behavior and it will work, because it is a behavior. For functions that take an event, you can pass the [`updates`](#DynamicUpdates) property of the dynamic.

The relationship of the event and behavior composing the dynamic is not arbitrary. The event should be occurring with the value of the behavior at the time of occurrence, and the value of the behavior can only change if the update event occurs. Therefore, if transforming the behavior of a dynamic, the event must be [pointed to the transformed behavior](#EventTag) and if transforming the event of a dynamic, the behavior must [always reflect the latest value from the event](#DynamicHold).

#### `Dynamic.hold`

`Dynamic.hold (initialValue) (event)`

Turns an event into a dynamic whose value starts as `initialValue` and updates to the occurrence value of the event when it occurs.

```js
const event = Event.create()
const dynamic = Dynamic.hold (0) (event)
dynamic.sample() // 0
event.occur(1)
dynamic.sample() // 1
```

#### `Dynamic.updates`

`Dynamic.updates (dynamic)`

Returns the update event of the dynamic. You also also do this simply by accessing the `.updates` on a dynamic - `dynamic.updates`.

#### `Dynamic.filter`

`Dynamic.filter (predicate) (dynamic)`

Like [`Event.filter`](#EventFilter), but takes a dynamic and returns a dynamic that will only update if the input dynamic's update occurrence value passes the predicate.

#### `Dynamic.map`

`Dynamic.map (a => b) (dynamic)`

Like [`Behavior.map`](#BehaviorMap).

#### `Dynamic.constant`

`Dynamic.constant (v)`

Like [`Behavior.constant`](#BehaviorConstant), with an `updates` event that [never occurs](#EventNever).

#### `Dynamic.lift`

`Dynamic.lift ((...values) => result) ([ ...behaviors ])`

Like [`Behavior.lift`](#BehaviorLift).

#### `Dynamic.lift2 (a => b => c) (a) (b)`

Like [`Behavior.lift2`](#BehaviorLift2).

#### `Dynamic.fold`

`Dynamic.fold (occurrenceValue => curentValue => newValue) (initialValue) (event)`

Like [`Dynamic.hold`](#DynamicHold), `fold` creates a dynamic from an event, starting from `initialValue`, and calls the given function when `event` occurs, passing the occurrence value of `event`, the current value of the dynamic, and the return value of the function is the new value of the dynamic.

```js
const event = Event.create()
const dynamic = Dynamic.fold (0) (event)
dynamic.sample() // 0
event.occur(1)
dynamic.sample() // 1
```

#### `Dynamic.forwardReference`

`Dynamic.forwardReference()`

Like [`Event.forwardReference`](#EventForwardReference) and [`Behavior.forwardReference`](#BehaviorForwardReference), but for a dynamic and must be assigned a dynamic.

## Concepts

TODO: this is currently a big information dump, with some coherent order and flow, but needs work. Ideas here may be redundant with ideas explained in the API section, but this has a lot of additional detail that may be helpful.

### Emitter

*Note: Emitter is a low level building block for `Event`, and is not directly part of the FRP system. Discussion of Emitter is solely for building up to higher level concepts of the library.*

This is an emitter of the typical variety - `{ emit, subscribe }`, except `emit` only takes on argument, the value to emit, and `subscribe` only takes one argument, the function to receive the emitted values. This moves the concern of naming out to the calling code, such as in variable or property names. More importantly, this makes it feasible to create operators that derive transformed emitters from other emitters.

For comparison:
```js
/* typical emitter */
emitter.subscribe('foo', handleFoo)
emitter.subscribe('bar', handleBar)
emitter.emit('foo', 123)
emitter.emit('bar', 456) /* this emitter */ // an example of giving meaning to the emitter by variable name fooEmitter.subscribe(handleFoo)
barEmitter.subscribe(handleBar)
fooEmitter.emit(123)
barEmitter.emit(456)

// an example of giving meaning to the emitter by property name
const emitters = {
	foo: Emitter.create()
	bar: Emitter.create()
}
fooEmitter.subscribe(handleFoo)
barEmitter.subscribe(handleBar)
fooEmitter.emit(123)
barEmitter.emit(456)
```

Transforming emitters:
```js
const numberEmitter = Emitter.create()
const doubledEmitter = Emitter.map (v => v * 2) (numberEmitter)
doubledEmitter.subscribe(console.log)
numberEmitter.emit(2)
// -> 4
numberEmitter.emit(10)
// -> 20
```

You can do many cool things, like combining emitters so that you get an emitter that emits when any of the given emitter emit, filter an emitter so that the resulting emitter only emits when the emitted value passes the predicate function, fold/reduce an emitter, and more.

#### propagation

This is what occurs when `emit` is called. It means calling all of the emitter's subscribers with the emitted value, synchronously and in the order they subscribed.

### time

We've solved one of the great philosophic mysteries: "what is time?". Time is a series of moments, where a moment is one complete propagation from an emitter. A moment of time means an `emit` being called and all of its subscribers being called.

```js
// This example doesn't mean anything fancy or abstract. Take it for nothing more than it is.
const ordinal = require('ordinal')

const emitterA = Emitter.create()
const emitterB = Emitter.create()

const logMomentOfTime = moment => console.log(`This is ${ordinal(moment)} moment in time.`)

emitterA.subscribe(logMomentOfTime)
emitterB.subscribe(logMomentOfTime)
emitterA.subscribe(logMomentOfTime)

emitterA.emit(1)
// "This is the 1st moment of time"
// "This is the 1st moment of time"
emitterB.emit(2)
// "This is the 2nd moment of time"
```

#### nested moments

Note that you can get into some fascinating insanity if you `emit` inside of a moment in time, because a whole moment of time would complete within the outer moment of time, meaning that, for example, the second moment of time could occur completely within the first moment of time, and the moment of time after the first moment of time would actually be the third moment of time. This is not a problem you should actually encounter using this library, but you should be aware of this to better understand what this library is and how it works.

```js
// Yet again, this is contrived and only serves to clarify the concept.
const emitterA = Emitter.create()
const emitterB = Emitter.create()

let time = 0
emitterA.subscribe(() => {
	++time
	emitterB.emit()
})
emitterB.subscribe(() => {
	++time
})
time // 0
emitterA.emit() // a moment in time
time // 2, strange!
```

#### correction

The rules so far are true for `Emitter`. `Event` is better and solves the nested emit/moment issue. `Emitter` is a lower level building block for `Event` and should not be used directly unless departing from the frp style of the library is desirable. The `Event` equivalent of `emit` is `occur`. A moment of time for `Event` is when `occur` is called on an event, and the occurrence has propagated through the entire dependency graph from that source event, with dependant events also potentially occuring **within the same moment**.

### Event

An Event is an Emitter, but enhanced with semantics of [event simultaneity](#event-simultaneity). Events are a list across time of occurrences, where an occurrence is a value at a time.
The name `Event` is chosen because it can represent the abstract idea of a thing which may happen, such as `fallFlatOnFace`, which may have many concrete occurrences.
It's easy to get tripped up and say event where you mean occurrence, or think `event` refers to the value passed to the subscriber (which is the occurrence value/description/information), so to put it another way, conceptually, `Event` is to `occurrence` what `Class` is to `object`.

#### event simultaneity

Being that moments of [time](#time) are introduced by `occur`, and no two calls to `occur` can be executed at the same instant (as even synchronous code is still executed in order), there can never be two simultaneous moments in time. However, [emitting within a subscription](#nested-moments) to an emitter is possible and necessary for composing emitters, though it is a semantic nightmare.

Consider the following composition and result from emitters:

```js
const map = fn => emitter => {
	// creates a new emitter and returns it
	const mappedEmitter = Emitter.create()
	// subscribes to the input emitter and emits when it emits
	emitter.subscribe(value => mappedEmitter.emit(fn(value)))
	return mappedEmitter
}

const a = Emitter.create()
const b = Emitter.map (add(1)) (a)
const c = Emitter.map (add(1)) (a)

// `merge` creates an emitter that emits when any of the given emitters emit
// Both given emitters are derived from the same emitter `a`
const d = Emitter.merge([ b, c ])

d.subscribe(console.log)

// `a.emit` introduces a moment of time, and `d` ends up with two moments of time
a.emit(0)
// 1
// 1
```

The issue is particularly that every emitter has an independent propagation to its subscribers. When an emitter emits within the subscribe function of another emitter, these are two independent propagations, and so in the above example `d` is composed from two indepedent propagation systems, which conceptually represent distinct moments in time. That means that, though `map` only expresses a transformation of the value of the given emitter, it implicitly generates a whole new moment in time as well. If you are into horrifying, but conceptually amazing implicit behavior, implicitly generating new time is pretty cool.

The solution to the emitter implicit time generation problem is to make a better kind of emitter, where emitters derived from other emitters carry the same system of propagation so that emits within emits are all within the same moment. In this library, this type is called `Event`. Conceptually, and as it is implemented in this library, the moment a derived Event occurs is the moment its dependencies occur. Because derived events may occur at the same moment, events that are derived from multiple other events can have simultaneous occurrences. Operators that cause a dependency on multiple events can specify how to handle simultaneous occurrences.

Now to revisit the example, but using Event:
```js
const a = Event.create()
const b = Event.map (add(1)) (a)
const c = Event.map (add(1)) (a)
/*
	Note that this example is silly,
	in that we know `b` and `c` will always occur at the same time,
	so if we want a value of `1`, we may as well not merge these.
	However, `b` and `c` could be other compositions of emitters,
	such as `filter`, so that the events may not always occur together (if ever).
*/
const d = Event.merge (([ b, c ]) => b) ([ b, c ])
d.subscribe(console.log)

// `a.occur` introduces a moment of time, and `d` occurs in the same moment
a.occur(0)
// 1
```

Event simultaneity solves not only the aforementioned issues pertaining to events, but provides the foundation for reactive values (behavior/dynamic) to be implemented without suffering the common glitching/dirty-read issue, which some libraries handle at the reactive value level, and some libraries do not handle at all.

#### glitch

A glitch is when a reactive value is observed having a value not consistent with its composition.

```
// read this as though all expressions update when any references change - all references are reactive
a = 0
b = a + 1
c = a + 1
d = b + c
log(`value of d is ${d}`)
-> value of d is 2

a = 1
-> value of d is 3 # this is a glitch!
-> value of d is 4
```

[Reactive Progamming Glitches on Wikiepdia](https://en.wikipedia.org/wiki/Reactive_programming#Glitches)

## Comparing approaches to reactive programming

TODO:
