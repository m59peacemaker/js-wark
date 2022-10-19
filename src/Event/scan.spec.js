import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Dynamic, Sample } from '../index.js'

const test = suite('Event.scan')

test('starts with the initial value and updates to the result of the reducer when the input event occurs', () => {
	const update_values = []

	const a = Event.create ()
	const b = Event.scan (a => b => a + b) (0) (a)
	Event.calling (x => update_values.push(x)) (Dynamic.updates(b))

	assert.equal(Sample.get(b), 0)
	a.produce(1)
	assert.equal(Sample.get(b), 1)
	a.produce(2)
	assert.equal(Sample.get(b), 3)
	a.produce(3)
	assert.equal(Sample.get(b), 6)

	assert.equal(update_values, [ 1, 3, 6 ])
})

test.skip('completes when the input event completes', () => {
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

test.skip('', () => {
	const foo = initial_value => event =>
		Reference.forward_referencing (x =>
			Event.hold
			(initial_value)
			(Event.tag (x) (event))
		)

	const a = Event.exposed_producer()
	const b = foo (0) (a)

	assert.equal (Sample.get (b), 0)
	a.produce (1)
	assert.equal (Sample.get (b), 0)
	a.produce (2)
	assert.equal (Sample.get (b), 0)
})

test.run()
