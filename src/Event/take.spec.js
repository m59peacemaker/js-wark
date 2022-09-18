import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

const test = suite('Event.take')

test('occurs with n occurrences of input event', () => {
	const update_values = []

	const a = Event.exposed_producer()
	const b = Event.take (2) (a)
	Event.calling (x => update_values.push(x)) (b)

	a.produce(1)
	a.produce(2)
	a.produce(3)
	a.produce(4)

	assert.equal(update_values, [ 1, 2 ])
})

test('completes on nth occurrence of input event', () => {
	const values = []

	const a = Event.exposed_producer()
	const b = Event.take (2) (a)
	Event.calling (x => values.push(x)) (Event.complete(b))

	a.produce(1)
	a.produce(2)
	a.produce(3)
	a.produce(4)

	assert.equal(values, [ 2 ])
})

test('completes when the input event completes when input event completes before n occurrences', () => {
	const b_update_values = []
	const c_values = []
	const c_complete_values = []

	const a = Event.exposed_producer()
	const b = Event.scan (_ => b => b) (0) (Event.take (3) (a))
	const c = Event.take (2) (b.updates)

	Event.calling (x => b_update_values.push(x)) (b.updates)
	Event.calling (x => c_values.push(x)) (c)
	Event.calling (x => c_complete_values.push(x)) (Event.complete (c))

	a.produce(1)
	a.produce(2)
	a.produce(3)
	a.produce(4)

	assert.equal(b_update_values, [ 1, 2, 3 ])
	assert.equal(c_values, [ 1, 2 ])
	assert.equal(c_complete_values, [ 2 ])
})

test.run()
