import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

const test = suite('Event.scan')

test('starts with the initial value and updates to the result of the reducer when the input event occurs', () => {
	const update_values = []

	const a = Event.exposed_producer()
	const b = Event.scan (a => b => a + b) (0) (a)
	Event.calling (x => update_values.push(x)) (b.updates)

	assert.equal(b.run(), 0)
	a.produce(1)
	assert.equal(b.run(), 1)
	a.produce(2)
	assert.equal(b.run(), 3)
	a.produce(3)
	assert.equal(b.run(), 6)

	assert.equal(update_values, [ 1, 3, 6 ])
})

test('completes when the input event completes', () => {
	const update_values = []

	const a = Event.exposed_producer()
	const b = Event.scan (a => b => b) (0) (Event.take (2) (a))
	const c = Event.complete (b.updates)

	Event.calling (x => update_values.push(x)) (c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal(update_values, [ 2 ])
})

test.run()
