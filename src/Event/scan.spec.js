import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Dynamic, Reference } from '../index.js'

const test = suite('Event.scan')

test('starts with the initial value and updates to the result of the reducer when the input event occurs', () => {
	const update_values = []

	const a = Event.exposed_producer()
	const b = Event.scan (a => b => a + b) (0) (a)
	Event.calling (x => update_values.push(x)) (Dynamic.updates(b))

	assert.equal(Dynamic.get(b), 0)
	a.produce(1)
	assert.equal(Dynamic.get(b), 1)
	a.produce(2)
	assert.equal(Dynamic.get(b), 3)
	a.produce(3)
	assert.equal(Dynamic.get(b), 6)

	assert.equal(update_values, [ 1, 3, 6 ])
})

test('completes when the input event completes', () => {
	const update_values = []

	const a = Event.exposed_producer()
	const b = Event.scan (a => b => b) (0) (Event.take (2) (a))
	const c = Event.complete (Dynamic.updates(b))

	Event.calling (x => update_values.push(x)) (c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal(update_values, [ 2 ])
})

test('', () => {
	const foo = initial_value => event =>
		Reference.forward_reference (x =>
			Event.hold
			(initial_value)
			(Event.tag (x) (event))
		)

	const a = Event.exposed_producer()
	const b = foo (0) (a)

	assert.equal (Dynamic.get (b), 0)
	a.produce (1)
	assert.equal (Dynamic.get (b), 0)
	a.produce (2)
	assert.equal (Dynamic.get (b), 0)
})

test.run()
