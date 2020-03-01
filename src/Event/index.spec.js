import { test } from 'zora'
import * as Event from './'
import * as Behavior  from '../Behavior'
import { AtemporalEvent as AEvent } from './'
import { add, identity, collectValues } from '../utils'
import { Time } from '../Time'

// Event.of (time) ([ 1, 2, 3 ]) // Event(List(Occurrence(List(1, 2, 3)))) event with list of one occurrence with a list of 3 values
// Event.of (time) (1, 2, 3) // Event(List(Occurrence(1), Occurrence(2), Occurrence(3))) Event with a list of 3 occurrences each with one value
// const a = Event.of([ 1, 2, 3 ])
// const b = Event.chain (list => Event.of(...list)) (a)
// const c = Event.bufferN (3) (1) (b)
// const d = Event.concatAll ([ a, c ]) { time: 1, value: [ 1, 2, 3 ] }, { time: 4, value: [ 1, 2, 3 ] }

test('Event', t => {
	t.test('Event.snapshot', t => {
		t.test('continuous behavior', t => {
			const time = Time()
			const values = [ 1, 2, 3 ]
			const a = Event.of (time) (0, 0, 0)
			const b = Behavior.create(time, () => values.shift())
			const c = Event.snapshot (b => a => [ b, a ]) (b) (a)
			const actual = collectValues(c)
			time.start()
			t.deepEqual(actual(), [ [ 1, 0 ], [ 2, 0 ], [ 3, 0 ] ])
		})
		t.test('discrete behavior snapshotted by same event', t => {
			const time = Time()
			const a = Event.of (time) (1, 2, 3)
			const b = Behavior.hold (0) (a)
			const c = Event.snapshot (b => a => [ b, a ]) (b) (a)
			const actual = collectValues(c)
			time.start()
			t.deepEqual(actual(), [ [ 1, 1 ], [ 2, 2 ], [ 3, 3 ] ])
		})
		t.test('discrete behavior snapshotted by different event', t => {
			const time = Time()
			const a = Event.create(time)
			const b = Event.create(time)
			const c = Behavior.hold (0) (a)
			const d = Event.snapshot (b => a => [ b, a ]) (c) (b)
			const actual = collectValues(d)
			time.start()
			a.emit(1)
			t.equal(c.sample(), 1)
			a.emit(2)
			t.equal(c.sample(), 2)
			b.emit(5)
			b.emit(10)
			a.emit(3)
			a.emit(4)
			b.emit(15)
			t.deepEqual(actual(), [ [ 2, 5 ], [ 2, 10 ], [ 4, 15 ] ])
		})
	})
	t.test('generate multiple new moments from one moment and buffer them back to one moment', t => {
		const time = Time()
		// Event(List(Occurrence(List(1, 2, 3)))) event with list of one occurrence with a list of 3 values
		const a = Event.of (time) ([ 1, 2, 3 ])
		// Event(List(Occurrence(1), Occurrence(2), Occurrence(3))) Event with a list of 3 occurrences each with one value
		const b = Event.switchMap (list => Event.of (time) (...list)) (a)
		const c = Event.concatAll([ a, b ])
		const d = Event.bufferN (3) (1) (b)
		const e = Event.concatAll ([ a, d ])
		const f = Event.concatAllWith (v => v) ([ a, b, d ])
		const actualB = collectValues(b)
		const actualC = collectValues(c)
		const actualD = collectValues(d)
		const actualE = collectValues(e)
		const actualF = collectValues(f)

		time.start()

		t.deepEqual(actualB(), [ 1, 2, 3 ])
		t.deepEqual(actualC(), [ [ 1, 2, 3 ], 1, 2, 3 ])
		t.deepEqual(actualD(), [ [ 1, 2, 3 ] ])
		t.deepEqual(actualE(), [ [ 1, 2, 3 ], [ 1, 2, 3 ] ])
		t.deepEqual(actualF(), [
			{ 0: [ 1, 2, 3 ] },
			{ 1: 1 },
			{ 1: 2 },
			{ 1: 3, 2: [ 1, 2, 3 ] },
		])
	})

	t.test('Event.concatAllWith', t => {
		t.test('concatting events that always occur together', t => {
			const a = AEvent()
			const b = Event.map (add(1)) (a)
			const c = Event.map (add(2)) (a)
			const d = Event.concatAllWith (o => ({ occurrences : o })) ([ b, a, c ])
			const actual = collectValues(d)
			a.emit(10)
			t.deepEqual(actual(), [ { occurrences: { 0: 11, 1: 10, 2: 12 } } ])
		})
		t.test('concatting events that sometimes occur together', t => {
			const a = AEvent()
			const b = Event.map (add(1)) (a)
			const c = Event.filter (v => v > 9) (a)
			const d = Event.concatAllWith (o => ({ occurrences : o })) ([ b, a, c ])
			const actual = collectValues(d)
			a.emit(9)
			a.emit(10)
			t.deepEqual(actual(), [ { occurrences: { 0: 10, 1: 9 } }, { occurrences: { 0: 11, 1: 10, 2: 10} } ])
		})
	})

	t.test('Event.concatAll', t => {
		t.test('concatting events that never occur together emits the value of each event occurrence', t => {
			const a = AEvent()
			const b = AEvent()
			const c = Event.concatAll ([ a, b ])
			const actual = collectValues(c)
			b.emit(10)
			a.emit(20)
			a.emit(30)
			b.emit(40)
			t.deepEqual(actual(), [ 10, 20, 30, 40 ])
		})
		t.test('concatting events that sometimes occur together always emits the value of the first given event', t => {
			const a = AEvent()
			const b = Event.filter (v => v < 10 || (v !== 10 && v % 2 === 0)) (a)
			const c = Event.filter (v => v > 10 || (v !== 10 && v % 2 === 0)) (a)
			const d = Event.concatAll ([ b, c ])
			const actual = collectValues(d)
			a.emit(9)  // b, < 10
			a.emit(10)
			a.emit(11) // c, > 10
			a.emit(12) // b, c % 2 === 0
			a.emit(13) // c > 10
			t.deepEqual(actual(), [ 9, 11, 12, 13 ])
		})
		t.test('concatting events that always occur together always emits the value of the first given event', t => {
			const a = AEvent()
			const b = Event.map (add(1)) (a)
			const c = Event.concatAll ([ a, b ])
			const actual = collectValues(c)
			a.emit(20)
			a.emit(30)
			t.deepEqual(actual(), [ 20, 30 ])
		})
	})

	t.test('Event.map', t => {
		const a = AEvent()
		const b = Event.map (add(1)) (a)
		const actualA = collectValues(a)
		const actualB = collectValues(b)

		a.emit(10)
		a.emit(20)

		t.deepEqual(actualA(), [ 10, 20 ])
		t.deepEqual(actualB(), [ 11, 21 ])
	})

	t.test('Event.switchMap', async t => {
		await t.test('has the occurrences of only the most recent event', t => {
			const a = AEvent()
			const b = AEvent()
			const c = AEvent()
			const d = Event.switchMap (v => v) (c)

			const actual = collectValues(d)

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
			const a = AEvent()
			const b = AEvent()
			const c = AEvent()
			const d = Event.switchMap (v => v) (c)
			const e = Event.map (add(1)) (d)

			const actual = collectValues(e)

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

		await t.test('works with other switching events', t => {
			const a = AEvent()
			const b = AEvent()
			const eventOfEvent1 = AEvent()
			const eventOfEvent2 = AEvent()
			const switch1 = Event.switchMap (identity) (eventOfEvent1)
			const switch2 = Event.switchMap (identity) (eventOfEvent2)
			const eventOfSwitches = AEvent()
			const switchOfSwitches = Event.switchMap (identity) (eventOfSwitches)

			const actual = collectValues(switchOfSwitches)

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

})

	// test('Event.flatMap', async t => {
	// 	return
	// 	await t.test('', t => {
	// 		const a = AEvent()
	// 		const b = AEvent()
	// 		const c = AEvent()
	// 		const d = Event.flatMap (v => v) (c)

	// 		const actual = collectValues(d)

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
	// 		const a = AEvent()
	// 		const b = Event.of(1, 2)
	// 		const c = Event.of(3)
	// 		const d = Event.of(b, c)
	// 		const e = Event.flatMap (v => v) (d)

	// 		const actual = collectValues(e)

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

	// 		const actual = collectValues(f)

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
	// 	const a = AEvent()
	// 	const aa = AEvent()
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
