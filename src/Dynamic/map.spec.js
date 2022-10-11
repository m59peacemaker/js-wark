import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event } from '../index.js'

const test = suite('Dynamic.map')

test('transforms Dynamic X to Dynamic Y via the input function X -> Y', () => {
	const a = Dynamic.create(0)
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
	const a = Event.exposed_producer()
	const b = Event.hold (0) (a)
	const c = Dynamic.map (x => x + 1) (b)
	const d = Event.tag (c) (a)
	Event.calling (x => values_c_updates.push(x)) (Dynamic.updates (c))
	Event.calling (x => values_d.push(x)) (d)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	assert.equal(values_c_updates, [ 2, 3, 4 ])
	assert.equal(values_d, [ 1, 2, 3 ])
})

test.run()
