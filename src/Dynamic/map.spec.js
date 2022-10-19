import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event } from '../index.js'

const test = suite('Dynamic.map')

test('transforms Dynamic X to Dynamic Y via the input function X -> Y', () => {
	const a = Dynamic.create (0)
	const b = Dynamic.map (x => x + 1) (a)
	const values = []
	Event.calling (x => values.push(x)) (Dynamic.updates(b))

	a.updates.produce (1)
	a.updates.produce (2)
	a.updates.produce (3)

	assert.equal (values, [ 2, 3, 4 ])
})

test('value remains the same until the subsequent instant of its update', () => {
	const values_c_updates = []
	const values_d = []
	const a = Event.create()
	const b = Event.hold (0) (a)
	const c = Dynamic.map (x => x + 1) (b)
	const d = Event.tag (c) (a)
	Event.calling (x => values_c_updates.push(x)) (c.updates)
	Event.calling (x => values_d.push(x)) (d)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	assert.equal(values_c_updates, [ 2, 3, 4 ])
	assert.equal(values_d, [ 1, 2, 3 ])
})

test(
	'computes only when value is checked when its updates are not observed',
	() => {
		const values = []
		const a = Event.create()
		const b = Event.hold (0) (a)
		let calls = 0
		const c = Dynamic.map
			(x => {
				++calls
				return x + 100
			})
			(b)
		const d = Event.create()
		const e = Event.tag (c) (d)
		Event.calling (x => values.push(x)) (e)
		a.produce(1)
		assert.equal(calls, 0)
		d.produce('_')
		assert.equal(calls, 1)
		assert.equal(values, [ 101 ])
	}
)

test.run()
