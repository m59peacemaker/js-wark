import { test } from 'zora'
import * as Event from '../Event'
import * as Dynamic from './'
import { rightNow } from '../'
import { add, valuesOf } from '../utils'

test('Dynamic', t => {
	const actual = rightNow(({ dynamicOf }) => {
		const a = dynamicOf(0)
		const b = Dynamic.map (add(1)) (a)
		t.equal(b.sample(), 1)
		return valuesOf(b)
	})
	t.equal(actual(), [ 1 ])

	t.test('Dynamic.hold', t => {
		const actual = rightNow(({ eventOf, dynamicOf }) => {
			const event = eventOf( 1, 2, 3)
			const dynamic = Dynamic.hold (0) (event)
			t.equal(dynamic.sample(), 0)
			return valuesOf(dynamic)
		})
		t.equal(actual(), [ 1, 2, 3 ])
	})

	t.test('Dynamic.filter', t => {
		const event = Event.create()
		const dynamic = Dynamic.hold (0) (event)
		const filtered = Dynamic.filter (v => v > 2) (dynamic)

		const dynamicActual = valuesOf(dynamic)
		const filteredActual = valuesOf(filtered)

		t.equal(dynamic.sample(), 0)
		t.equal(filtered.sample(), 0)

		event.emit(1)
		t.equal(dynamic.sample(), 1)
		t.equal(filtered.sample(), 0)

		event.emit(2)
		t.equal(dynamic.sample(), 2)
		t.equal(filtered.sample(), 0)

		event.emit(3)
		t.equal(dynamic.sample(), 3)
		t.equal(filtered.sample(), 3)

		event.emit(4)
		t.equal(dynamic.sample(), 4)
		t.equal(filtered.sample(), 4)

		t.equal(dynamicActual(), [ 1, 2, 3, 4 ])
		t.equal(filteredActual(), [ 3, 4 ])
	})
})
