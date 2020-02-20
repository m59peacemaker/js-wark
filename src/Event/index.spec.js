import { test } from 'zora'
import * as Event from '../Event'
import { add, identity, valuesOf } from '../utils'

test('Event.switchMap', async t => {
	await t.test('has the occurrences of only the most recent event', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.create()
		const d = Event.switchMap (v => v) (c)

		const actual = valuesOf(d)

		c.emit(a)
		a.emit(1)
		a.emit(2)
		c.emit(b)
		b.emit(3)
		b.emit(4)
		a.emit('x')
		b.emit(5)
		c.emit(a)
		a.emit(6)
		b.emit('x')
		a.emit(7)
		c.emit(b)
		b.emit(8)

		t.deepEqual(actual(), [ 1, 2, 3, 4, 5, 6, 7, 8 ])
	})

	await t.test('does not break the next operator', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.create()
		const d = Event.switchMap (v => v) (c)
		const e = Event.map (add(1)) (d)

		const actual = valuesOf(e)

		c.emit(a)
		a.emit(1)
		a.emit(2)
		c.emit(b)
		b.emit(3)
		b.emit(4)
		a.emit('x')
		b.emit(5)
		c.emit(a)
		a.emit(6)
		b.emit('x')
		a.emit(7)
		c.emit(b)
		b.emit(8)

		t.deepEqual(actual(), [ 2, 3, 4, 5, 6, 7, 8, 9 ])
	})

	await t.test('applies the map function to each value', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.switchMap (add(1)) (b)

		const actual = valuesOf(c)

		b.emit(a)
		a.emit(4)
		a.emit(9)

		t.deepEqual(actual(), [ 5, 10 ])
	})

	await t.test('works with other switching events', t => {
		const a = Event.create()
		const b = Event.create()
		const eventOfEvent1 = Event.create()
		const eventOfEvent2 = Event.create()
		const switch1 = Event.switchMap (identity) (eventOfEvent1)
		const switch2 = Event.switchMap (identity) (eventOfEvent2)
		const eventOfSwitches = Event.create()
		const switchOfSwitches = Event.switchMap (identity) (eventOfSwitches)

		const actual = valuesOf(switchOfSwitches)

		eventOfSwitches.emit(switch1)
		eventOfEvent1.emit(a)
		a.emit(5)
		eventOfEvent1.emit(b)
		a.emit('x')
		b.emit(10)
		eventOfEvent1.emit(a)
		a.emit(15)
		eventOfSwitches.emit(switch2)
		a.emit('x')
		b.emit('x')
		eventOfEvent2.emit(a)
		b.emit('x')
		a.emit(20)
		eventOfEvent2.emit(b)
		b.emit(25)
		eventOfSwitches.emit(switch1)
		b.emit('x')
		a.emit(30)

		t.deepEqual(actual(), [ 5, 10, 15, 20, 25, 30 ])
	})
})

// test('Event.flatMap', async t => {
// 	return
// 	await t.test('', t => {
// 		const a = Event.create()
// 		const b = Event.create()
// 		const c = Event.create()
// 		const d = Event.flatMap (v => v) (c)

// 		const actual = valuesOf(d)

// 		c.emit(a)

// 		a.emit(1)
// 		a.emit(2)

// 		c.emit(b)

// 		b.emit(3)
// 		b.emit(4)
// 		a.emit(5)
// 		b.emit(6)

// 		c.emit(a)

// 		a.emit(7)
// 		b.emit(8)
// 		a.emit(9)

// 		c.emit(b)

// 		b.emit(10)

// 		t.deepEqual(actual(), [ 1, 2, 3, 4, 5, 6, 7, 7, 8, 9, 9, 10, 10 ])
// 	})

// 	await t.test('', t => {
// 		const a = Event.create()
// 		const b = Event.of(1, 2)
// 		const c = Event.of(3)
// 		const d = Event.of(b, c)
// 		const e = Event.flatMap (v => v) (d)

// 		const actual = valuesOf(e)

// 		// lame... dependants must be actualized first
// 		;[ d, b, c ].forEach(e => e.actualize())

// 		d.emit(a)
// 		a.emit(4)

// 		t.deepEqual(actual(), [ 1, 2, 3, 4 ], actual())
// 	})

// 	await t.test('', t => {
// 		const a = Event.of('a')
// 		const b = Event.map (v => `${v}_b`) (a)
// 		const c = Event.map (v => `${v}_c`) (a)
// 		const d = Event.of(a, b, c)
// 		const e = Event.flatMap (v => `${v}_e`) (d)
// 		const f = Event.map (v => `${v}_f`) (e)

// 		a.name = 'a'
// 		b.name = 'b'
// 		c.name = 'c'
// 		d.name = 'd'
// 		e.name = 'e'
// 		f.name = 'f'

// 		const actual = valuesOf(f)

// 		;[ d, a ].forEach(e => e.actualize())

// 		t.deepEqual(actual(), [ 'a_e_f', 'a_b_e_f', 'a_c_e_f' ])
// 	})

// 	await t.test('', t => {
// 		// like the above test, but also emitting flatMapped events
// 	})
// })
//
/*
	If a source event changes, then anything *directly* dependent on it, meaning it was directly passed as a dependency, will definitely have an occurrence opportunity
	eh, I dunno

	a source event just occurs... there are no distinct steps in the process
	whereas a derived event needs to find the exact moment it can potentially occur and decide what to do then
	
	a derived event composed only of other derived events could have the situation where one or more or all of its dependencies has a tick, but none of them occur on it, and so this derived event would not be able to occur
	And that means that the opportunity to occur means having had a dependency that occurred in the current moment
	the moment is introduced by a source event, and only ever one source event,
	so we know that in the whole tree of dependencies, they can all be informed of the moment directly from the source event
	so all derived events should have a reference back to their sources
	the sources of a derived event are the source events in its dependencies or the sources in the derived events in its dependencies
	const sourceEvents = dependencies.reduce(
		(acc, dependency) => {
			dependency.constructor === DerivedEvent
				? acc.push(...dependency.sourceEvents)
				: acc.push(dependency)
			return acc
		},
		[]
	this probably doesn't work out


when combining events, you're either combining them as a pair, where all cases of their simultaneity are handled
const align = (leftHandler, rightHandler, bothHandler, leftEmitter, rightEmitter)

I need a combine fn that gets the simultaneous events that occurred keyed by index i.e. combine (fn) ([ foo, bar, baz ]), if `foo` and `baz` occurred simultaneously, the fn would get:
{ 0: fooValue, 2: bazValue }
and from this, all desirable combining operators should be possible
so this information needs to be collected when buffering the changes/propagation stuff


a source event doesn't 'pend occurrence', so the 3 parts of the transaction: pending_occurrence, the occurrence, and occurrence_settled aren't applicable
the occurrence of a source event represents all of these
so a derived event should check the type of the dependency and derive the meaning of those accordingly
a dependency occurrence is when a dependency emits regularly, of course

a dependencyPendingOccurrence is
Emitter.combine(dependencies.map(dependency => dependency.constructor === DerivedEvent ? dependency.occurrencePending: dependency))

a dependencyOccurrenceSettled is
Emitter.combine(dependencies.map(dependency => dependency.constructor === DerivedEvent ? dependency.occurrenceSettled: dependency))
*/

//const mergeWith = (fn, emitters) =>
//const merge = emitters => mergeWith (k, emitters)
//const align = (leftHandler, rightHandler, bothHandler, leftEmitter, rightEmitter) => combine
//log ({ count_of_dependencies_pending_occurrence })
//
/*
	Source events don't "pend" and "settle", but these properties provide consistency with derived events
	and "occurrence_pending" is used for the source event to introduce a moment of time through the graph.
	It would be nice if occurrence_pending could be dropped and only the occurrence of this event would be necessary,
	but currently, that will cause dependants to pend and settle before making their dependants pend.
*/

//const log = (things) => Object.entries(things).forEach(([ k, v ]) => v.subscribe(v => console.log({ [k]: v })))

// test('atomic signaling', t => {
// 	const a = Event.create()
// 	const aa = Event.create()
// 	const b = map (v => v - 1) (a)
// 	const c = map (v => v + 1) (a)
// 	//c.occurrence_opportunity.subscribe(v => v.emit((v.dependency_occurrences)))
// 	//const d = DerivedEvent({ dependencies: [ b, c, a, aa ] })
// 	//const d = DerivedEvent({ name: 'd', dependencies: [ b, c ] })
// 	const d = merge([ b, a, c, aa ])
// 	log({ a, b, c, d, aa })

// 	//;[ a, aa ].forEach(e => e.actualize())

// 	a.emit(123)
// 	aa.emit(456)
// })
//


