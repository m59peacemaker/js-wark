import { test } from 'zora'
import * as Behavior from './'
import * as Event from '../Event'
import { add, identity, valuesOf } from '../utils'

test('Behavior', async t => {
	await t.test('behavior.sample()', t => {
		const values = [ 'a', 'b', 'c' ]
		const b = Behavior.create(() => values.shift())
		t.deepEqual(
			[ b.sample(), b.sample(), b.sample() ],
			[ 'a', 'b', 'c' ]
		)
	})
	await t.test('Behavior.of creates a constant', t => {
		const b = Behavior.of(0)
		t.deepEqual(
			[ b.sample(1), b.sample(2) ],
			[ 0, 0 ]
		)
	})
	await t.test('Behavior.map', t => {
		const values = [ 0, 1 ]
		const b = Behavior.map (add(1)) (Behavior.create(() => values.shift()))
		t.deepEqual(
			[ b.sample(), b.sample() ],
			[ 1, 2 ]
		)
	})

	await t.test('not sure what to call this yet', t => {
		const event1 = Event.create()
		const hold1 = Behavior.hold (0) (event1)
		const hold2 = Behavior.hold (0) (event1)
		const event2 = Event.attach (hold1) (Event.tag (hold2) (event1))

		const actual = valuesOf(event2)

		event1.emit(1)
		event1.emit(2)
		event1.emit(3)

		t.deepEqual(actual(), [ [ 1, 1 ], [ 2, 2 ], [ 3, 3 ] ])
	})
})
