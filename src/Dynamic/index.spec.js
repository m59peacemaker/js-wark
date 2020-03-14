import { test } from 'zora'
import * as Event from '../Event'
import * as Behavior from '../Behavior'
import * as Dynamic from './'
import { add, collectValues } from '../util'

test('Dynamic', t => {
	t.test('Can be used just as a behavior', t => {
		const a = Dynamic.hold (2) (Event.create())
		const b = Behavior.map (add(3)) (a)
		const c = Behavior.lift (Array.of) ([ a, b ])
		t.equal(a.sample(), 2)
		t.equal(b.sample(), 5)
		t.equal(c.sample(), [ 2, 5 ])
	})

	t.test('Dynamic.hold', t => {
		const event = Event.create()
		const dynamic = Dynamic.hold (0) (event)
		const actual = collectValues(dynamic)
		event.occur(1)
		event.occur(2)
		event.occur(3)
		t.equal(actual(), [ 0, 1, 2, 3 ])
	})

	t.test('Dynamic.filter', t => {
		const event = Event.create()
		const dynamic = Dynamic.hold (0) (event)
		const filtered = Dynamic.filter (v => v > 2) (dynamic)

		const dynamicActual = collectValues(dynamic)
		const filteredActual = collectValues(filtered)

		t.equal(dynamic.sample(), 0)
		t.equal(filtered.sample(), 0)

		event.occur(1)
		t.equal(dynamic.sample(), 1)
		t.equal(filtered.sample(), 0)

		event.occur(2)
		t.equal(dynamic.sample(), 2)
		t.equal(filtered.sample(), 0)

		event.occur(3)
		t.equal(dynamic.sample(), 3)
		t.equal(filtered.sample(), 3)

		event.occur(4)
		t.equal(dynamic.sample(), 4)
		t.equal(filtered.sample(), 4)

		t.equal(dynamicActual(), [ 0, 1, 2, 3, 4 ])
		t.equal(filteredActual(), [ 0, 3, 4 ])
	})

	t.test('Dynamic.fold', t => {
		const a = Event.create()
		const b = Dynamic.fold (b => a => [ ...a, b ]) ([]) (a)
		t.equal(b.sample(), [])
		a.occur(1)
		t.equal(b.sample(), [ 1 ])
		a.occur(4)
		t.equal(b.sample(), [ 1, 4 ])
		a.occur(10)
		t.equal(b.sample(), [ 1, 4, 10 ])
	})

	t.test('Dynamic.forwardReference', t => {
		const event = Event.create()
		const forwardReference = Behavior.forwardReference()
		const snapshot = Event.snapshot (b => a => [ ...b, a ]) (forwardReference) (event)
		const hold = forwardReference.assign (Dynamic.hold ([]) (snapshot))
		t.deepEqual(hold.sample(), [])
		event.occur(1)
		t.deepEqual(hold.sample(), [ 1 ])
		event.occur(2)
		t.deepEqual(hold.sample(), [ 1, 2 ])
	})
})

test('Dynamic.bufferN', t => {
	t.test('bufferN (4) (1)', t => {
		const a = Event.create()
		const b = Dynamic.bufferN (4) (1) (a)
		const actual = collectValues(b)

		;[ 1, 2, 3, 4, 5, 6 ].forEach(a.occur)

		t.deepEqual(actual(), [
			[],
			[ 1, 2, 3, 4 ],
			[ 2, 3, 4, 5 ],
			[ 3, 4, 5, 6 ]
		])
	})

	t.test('bufferN (3) (3)', t => {
		const a = Event.create()
		const b = Dynamic.bufferN (3) (3) (a)
		const actual = collectValues(b.updates)

		;[ 1, 2, 3, 4, 5, 6, 7, 8, 9 ].forEach(a.occur)
		
		t.deepEqual(actual(), [
			[ 1, 2, 3 ],
			[ 4, 5, 6 ],
			[ 7, 8, 9 ]
		])
	})

	t.test('bufferN (3) (2)', t => {
		const a = Event.create()
		const b = Dynamic.bufferN (3) (2) (a)
		const actual = collectValues(b.updates)

		;[ 1, 2, 3, 4, 5, 6, 7, 8 ].forEach(a.occur)

		t.deepEqual(actual(), [
			[ 1, 2, 3 ],
			[ 3, 4, 5 ],
			[ 5, 6, 7 ]
		])
	})

	t.test('bufferN (2) (4)', t => {
		const a = Event.create()
		const b = Dynamic.bufferN (2) (4) (a)
		const actual = collectValues(b.updates)

		;[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ].forEach(a.occur)

		t.deepEqual(actual(), [
			[ 1, 2 ],
			[ 5, 6 ],
			[ 9, 10 ]
		])
	})
})

test('Dynamic.pairwise', t => {
	const a = Event.create()
	const b = Dynamic.pairwise(a)
	const actual = collectValues(b)

	;[ 1, 2, 3, 4 ].forEach(a.occur)

	t.deepEqual(actual(), [ [], [ 1, 2 ], [ 2, 3 ], [ 3, 4 ] ])
})
