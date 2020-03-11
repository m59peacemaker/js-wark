import { test } from 'zora'
import * as Event from './'
import * as Behavior  from '../Behavior'
import * as Dynamic from '../Dynamic'
import { add, identity, collectValues, pipe } from '../util'

test('Event', t => {
	t.test('event.t()', t => {
		// Some extremely bad things are about to go down in this test. DO NOT DO SUCH THINGS IN YOUR APPLICATION CODE. EVER. EVER. EVEREST.
		// DO NOT DO IT.
		const a = Event.create()
		const at = Behavior.create(a.t)
		t.equal(a.t(), null)
		t.equal(at.sample(a.t()), null)
		a.occur()
		const t0 = a.t()
		t.equal(typeof t0, 'symbol', 't is a symbol')
		t.equal(Number.isInteger(Number(t0.description)), true, 't description value is a string of an integer')
		t.equal(a.t(), at.sample(t0))
		t.equal(a.t(), at.sample(t0))
		a.occur()
		const t1 = a.t()
		t.notEqual(t0, t1, 'event t changes on occurrence')
		t.equal(t1, at.sample(t1), 'sampling a behavior with new t gets updated behavior value')
		t.equal(t1, at.sample(t1), 'sampling a behavior with the same/current t gets same behavior value')
	})
	t.test('Event.snapshot', t => {
		t.test('continuous behavior', t => {
			const a = Event.create()
			const behaviorValues = [ 1, 2, 3 ]
			const b = Behavior.create(() => behaviorValues.shift())
			const c = Event.snapshot (b => a => [ b, a ]) (b) (a)
			const actual = collectValues(c)
			a.occur(0)
			a.occur(0)
			a.occur(0)
			t.deepEqual(actual(), [ [ 1, 0 ], [ 2, 0 ], [ 3, 0 ] ])
		})
		t.test('dynamic snapshotted from the same event that updates it', t => {
			const a = Event.create()
			const b = Dynamic.hold (0) (a)
			const c = Event.snapshot (b => a => [ b, a ]) (b) (a)
			const actual = collectValues(c)
			a.occur(1)
			a.occur(2)
			a.occur(3)
			t.deepEqual(actual(), [ [ 1, 1 ], [ 2, 2 ], [ 3, 3 ] ])
		})
		t.test('dynamic snapshotted by event that is not the same one that updates it', t => {
			const a = Event.create()
			const b = Event.create()
			const c = Dynamic.hold (0) (a)
			const d = Event.snapshot (b => a => [ b, a ]) (c) (b)
			const actual = collectValues(d)
			a.occur(1)
			t.equal(c.sample(), 1)
			a.occur(2)
			t.equal(c.sample(), 2)
			b.occur(5)
			b.occur(10)
			a.occur(3)
			a.occur(4)
			b.occur(15)
			t.deepEqual(actual(), [ [ 2, 5 ], [ 2, 10 ], [ 4, 15 ] ])
		})
	})
	// TODO:
	t.skip('generate multiple new moments from one moment and buffer them back to one moment', t => {
		// Event(List(Occurrence(List(1, 2, 3)))) event with list of one occurrence with a list of 3 values
		const a = Event.create()
		// Event(List(Occurrence(1), Occurrence(2), Occurrence(3))) Event with a list of 3 occurrences each with one value
		const b = Event.switchMap (list => Event.magicTimePowersX (...list)) (a)
		const c = Event.concatAll([ a, b ])
		const d = Event.bufferN (3) (1) (b)
		const e = Event.concatAll ([ a, d ])
		const f = Event.combineAllWith (v => v) ([ a, b, d ])
		const actualB = collectValues(b)
		const actualC = collectValues(c)
		const actualD = collectValues(d)
		const actualE = collectValues(e)
		const actualF = collectValues(f)

		a.occur(1)
		a.occur(2)
		a.occur(3)

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

	t.test('Event.combineAllWith', t => {
		t.test('combining events that always occur together', t => {
			const a = Event.create()
			const b = Event.map (add(1)) (a)
			const c = Event.map (add(2)) (a)
			const d = Event.combineAllWith (o => ({ occurrences : o })) ([ b, a, c ])
			const actual = collectValues(d)
			a.occur(10)
			t.deepEqual(actual(), [ { occurrences: { 0: 11, 1: 10, 2: 12 } } ])
		})
		t.test('combining events that sometimes occur together', t => {
			const a = Event.create()
			const b = Event.map (add(1)) (a)
			const c = Event.filter (v => v > 9) (a)
			const d = Event.combineAllWith (o => ({ occurrences : o })) ([ b, a, c ])
			const actual = collectValues(d)
			a.occur(9)
			a.occur(10)
			t.deepEqual(actual(), [ { occurrences: { 0: 10, 1: 9 } }, { occurrences: { 0: 11, 1: 10, 2: 10} } ])
		})
	})

	t.test('Event.combineKeyedWith', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.map (identity) (a)
		const d = Event.combineKeyedWith (Object.entries) ({ a, b, c })
		const actual = collectValues(d)
		a.occur(0)
		b.occur(1)
		t.deepEqual(
			actual(),
			[
				[ [ 'a', 0 ], [ 'c', 0 ] ],
				[ [ 'b' , 1 ] ]
			]
		)
	})

	t.test('Event.combineKeyed', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.map (identity) (a)
		const d = Event.combineKeyed({ a, b, c })
		const actual = collectValues(d)
		a.occur(0)
		b.occur(1)
		t.deepEqual(actual(), [ { a: 0, c: 0 }, { b: 1 } ])
	})

	t.test('Event.concatWith', t => {
		t.test('whenA, whenB', t => {
			const a = Event.create()
			const b = Event.create()
			const c = Event.concatWith (a => a + a) (b => b + b) (t.fail) (a) (b)
			const actual = collectValues(c)
			b.occur('b')
			b.occur('b')
			a.occur('a')
			b.occur('b')
			a.occur('a')
			t.deepEqual(actual(), [ 'bb', 'bb', 'aa', 'bb', 'aa' ])
		})
		t.test('whenAB', t => {
			const a = Event.create()
			const b = Event.filter (v => v % 2 === 0) (a)
			const c = Event.concatWith (identity) (t.fail) (a => b => [ a, b ]) (a) (b)
			const actual = collectValues(c)
			a.occur(0)
			a.occur(5)
			a.occur(10)
			a.occur(15)
			t.deepEqual(actual(), [ [ 0, 0 ], 5, [ 10, 10 ], 15 ])
		})
	})

	t.test('Event.concatAll', t => {
		t.test('concats given events', t => {
			const a = Event.create()
			const b = Event.create()
			const c = Event.create()
			const d = Event.concatAll ([ a, b, c ])
			const actual = collectValues(d)
			a.occur(1)
			a.occur(2)
			b.occur(3)
			c.occur(4)
			t.deepEqual(actual(), [ 1, 2, 3, 4 ])
		})
		t.test('throws on simultaneous occurrence', t => {
			const a = Event.create()
			const b = Event.map (identity) (a)
			const c = Event.concatAll ([ a, b ])
			try {
				a.occur()
				t.fail('did not throw on simultaneous occurrence!')
			} catch (error) {
				t.ok(true, error)
			}
		})
	})

	t.test('Event.concat', t => {
		t.test('concats given events', t => {
			const a = Event.create()
			const b = Event.create()
			const c = Event.concat (a) (b)
			const actual = collectValues(c)
			a.occur(1)
			a.occur(2)
			b.occur(3)
			a.occur(4)
			t.deepEqual(actual(), [ 1, 2, 3, 4 ])
		})
	})

	t.test('Event.combineByLeftmost', t => {
		t.test('concatting events that never occur together occurs with the value of each event occurrence', t => {
			const a = Event.create()
			const b = Event.create()
			const c = Event.combineByLeftmost([ a, b ])
			const actual = collectValues(c)
			b.occur(10)
			a.occur(20)
			a.occur(30)
			b.occur(40)
			t.deepEqual(actual(), [ 10, 20, 30, 40 ])
		})
		t.test('concatting events that sometimes occur together always occurs with the value of the first given event', t => {
			const a = Event.create()
			const b = Event.filter (v => v < 10 || (v !== 10 && v % 2 === 0)) (a)
			const c = Event.filter (v => v > 10 || (v !== 10 && v % 2 === 0)) (a)
			const d = Event.combineByLeftmost([ b, c ])
			const actual = collectValues(d)
			a.occur(9)  // b, < 10
			a.occur(10)
			a.occur(11) // c, > 10
			a.occur(12) // b, c % 2 === 0
			a.occur(13) // c > 10
			t.deepEqual(actual(), [ 9, 11, 12, 13 ])
		})
		t.test('concatting events that always occur together always occurs the value of the first given event', t => {
			const a = Event.create()
			const b = Event.map (add(1)) (a)
			const c = Event.combineByLeftmost([ a, b ])
			const actual = collectValues(c)
			a.occur(20)
			a.occur(30)
			t.deepEqual(actual(), [ 20, 30 ])
		})
	})

	t.test('Event.map', t => {
		const a = Event.create()
		const b = Event.map (add(1)) (a)
		const actualA = collectValues(a)
		const actualB = collectValues(b)

		a.occur(10)
		a.occur(20)

		t.deepEqual(actualA(), [ 10, 20 ])
		t.deepEqual(actualB(), [ 11, 21 ])
	})

	t.test('Event.filter', t => {
		const a = Event.create()
		const b = pipe ([
			Event.map (add(10)),
			Event.filter (v => v % 2 === 0),
			Event.map (add(1)),
			Event.map (add(1)),
			Event.filter(v => v !== 18),
			Event.map (v => v * 2)
		]) (a)
		const actual = collectValues(b)

		;[ 1, 2, 3, 4, 5, 6, 7, 8 ].forEach(a.occur)

		t.deepEqual(actual(), [ 28, 32, 40 ])
	})

	t.test('Event.switchMap', async t => {
		await t.test('has the occurrences of only the most recent event', t => {
			const a = Event.create()
			const b = Event.create()
			const c = Event.create()
			const d = Event.switchMap (v => v) (c)

			const actual = collectValues(d)

			c.occur(a)
			a.occur(1)
			a.occur(2)
			c.occur(b)
			b.occur(3)
			b.occur(4)
			a.occur('x')
			b.occur(5)
			c.occur(a)
			a.occur(6)
			b.occur('x')
			a.occur(7)
			c.occur(b)
			b.occur(8)

			t.deepEqual(actual(), [ 1, 2, 3, 4, 5, 6, 7, 8 ])
		})

		await t.test('does not break the next operator', t => {
			const a = Event.create()
			const b = Event.create()
			const c = Event.create()
			const d = Event.switchMap (v => v) (c)
			const e = Event.map (add(1)) (d)

			const actual = collectValues(e)

			c.occur(a)
			a.occur(1)
			a.occur(2)
			c.occur(b)
			b.occur(3)
			b.occur(4)
			a.occur('x')
			b.occur(5)
			c.occur(a)
			a.occur(6)
			b.occur('x')
			a.occur(7)
			c.occur(b)
			b.occur(8)

			t.deepEqual(actual(), [ 2, 3, 4, 5, 6, 7, 8, 9 ])
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

			const actual = collectValues(switchOfSwitches)

			eventOfSwitches.occur(switch1)
			eventOfEvent1.occur(a)
			a.occur(5)
			eventOfEvent1.occur(b)
			a.occur('x')
			b.occur(10)
			eventOfEvent1.occur(a)
			a.occur(15)
			eventOfSwitches.occur(switch2)
			a.occur('x')
			b.occur('x')
			eventOfEvent2.occur(a)
			b.occur('x')
			a.occur(20)
			eventOfEvent2.occur(b)
			b.occur(25)
			eventOfSwitches.occur(switch1)
			b.occur('x')
			a.occur(30)

			t.deepEqual(actual(), [ 5, 10, 15, 20, 25, 30 ])
		})
	})
})
