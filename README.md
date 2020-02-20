# wark

> avoid pain and suffering and fly around on a chocobo or something

![Wark!](https://user-images.githubusercontent.com/4369247/33407500-42f7d608-d537-11e7-9754-1ef262f9d6ad.png)

## install

```sh
$ npm install wark
```

## Glossary

### Emitter

An Emitter is a lower-level building block for `Event`. This is an emitter of the typical variety - `{ emit, subscribe }`, except `emit` only takes on argument, the value to emit, and `subscribe` only takes one argument, the function to receive the emitted values. This moves the concern of naming out to the calling code, such as in variable or property names. More importantly, this makes it feasible to create operators that derive transformed emitters from other emitters.

For comparison:
```js
/* typical emitter */
emitter.subscribe('foo', handleFoo)
emitter.subscribe('bar', handleBar)
emitter.emit('foo', 123)
emitter.emit('bar', 456)

/* this emitter */
// an example of giving meaning to the emitter by variable name
fooEmitter.subscribe(handleFoo)
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

#### correction

The rules so far are true for `Emitter`. `Event` is better and solves the nested emit/moment issue. When speaking of `Event` (which will usually be the case!), a moment of times means an `emit` being called and all of its subscribers being called, **unless already within a moment of time**. In such a case, the nested emit joins in the same moment already occurring and does not do the madness of generating a new moment of time, nested within another.

### Event

An Event is an Emitter, but enhanced with semantics of [event simultaneity](#event-simultaneity). Events are a list across time of occurrences, where an occurrence is a value at a time.
The name `Event` is chosen because it can represent the abstract idea of a thing which may happen, such as `fallFlatOnFace`, which may have many concrete occurrences.
It's easy to get tripped up and say event where you mean occurrence, or think `event` refers to the value passed to the subscriber (which is the occurrence value), so to put it another way, `Event` is t`occurrence` what `Class` is to `object`.

#### event simultaneity

Being that moments of [time](#time) are introduced by `emit`, and no two calls to `emit` can be executed at the same instant (as even synchronous code is still executed in order), there can never be two simultaneous moments in time. However, [emitting within a subscription](#nested-moments) to an emitter is possible and necessary for composing emitters, and it is a semantic nightmare.

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

The issue is particularly that every emitter has an independent propagation to its subscribers. When an emitter emits within the subscribe function of another emitter, these are two independent propagations, and so in the above example `d` is composed from two indepedent propagation systems, which conceptually represent distinct moments in time. That means that, though `map` only expressed a transformation of the value of the given emitter, it implicitly generates a whole new moment in time as well. If you are into horrifying, but conceptually amazing implicit behavior, implicitly generating new time is pretty cool.

The solution to the emitter implicit time generation problem is to make a better kind of emitter, where emitters derived from other emitters carry the same system of propagation so that emits within emits are all within the same moment. In this library, this type is called `Event`. Conceptually, and as it is implemented in this library, the moment a derived Event occurs is the moment its dependencies occur. Because derived events may occur at the same moment, events that are derived from multiple other events can have simultaneous occurrences. Operators that cause a dependency on multiple events are required to specify how to handle simultaneous occurrences.

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
	such a `filter`, where they may not always occur together (if ever).
*/
const d = Event.merge (([ b, c ]) => b) ([ b, c ])
d.subscribe(console.log)

// `a.emit` introduces a moment of time, and `d` occurs in the same moment
a.emit(0)
// 1
```

### Behavior

#### conceptually

A Behavior is a function across time; simply `currentTime => valueForTheCurrentTime`. Because you call a function at some time, you can think of the function call as the "time" and so the function is `() => valueForTheCurrentTime`; a function that returns a changing value. However, if it were possible to call this function twice at the exact same time (as in 'event simultaneity') the result must be the same, because the time is the same, and a behavior is a function from time to value at that time. The same time must have the same value. It could be helpful to think of Behaviors as pull-based, whereas Events are push-based.

#### practically

A Behavior is just a type for composing around an impure function call, such as hanging on to an event occurrence value so that it can be used independent of the event, and to do this efficiently within the context of the FRP system. It is possible to ensure a behavior's value is only computed once per "moment" and, maybe only if actually needed by something in that moment. The efficiency topic could use some investigation. I'm not currently sure how inefficient this implementation is. Possibly very inefficient.

### Dynamic

A Dynamic is, in every sense, both an Event and a Behavior. The code that creates them is simply `(event, behavior) => ({ ...event, ...behavior })`. You can pass a dynamic to a function that takes an event, and it will work as an event, because it is one. You can pass a dynamic to a function that takes a behavior and it will work, because it is one. Just keep in mind that if a function takes an event and returns an event, if you pass a dynamic as the event, you will get back an event, not a dynamic, because the function doesn't know anything about dynamics. The same applies for functions that work with behaviors.

The relationship of the event and behavior composing the dynamic is not arbitrary. The event should be occurring with the value of the behavior at the time of occurrence, and the value of the behavior can only change if the event occurs. Therefore, if transforming the behavior of a dynamic, the event must be [pointed to the transformed behavior](#tag) and if transforming the event of a dynamic, the behavior must [always reflect the latest value from the event](#hold).

## API

### Event

#### merge

NOTE: and TODO:
All the needed information is available here in merge, but it does feel in need of much sugar. This API will hopefully improve.

This example returns all the simultaneous occurrence values if they all occurred, otherwise just takes the first value, regardless of which event it was from.
```js
Event.merge
	(possibleOccurrences => {
		const occurred = possibleOccurrences.filter(o => o !== Event.didNotOccur) // Event.occurred(possibleOccurrences)
		const allOccurred = possibleOccurrences.length === occurred.length
		return allOccurred
			? occurred
			: occurred[0]
	})
	[ ...someEvents ]
```
