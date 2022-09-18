import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

const test = suite('Event.map')

test('occurs when input event occurs, with input event value transformed by f', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.map (x => x + 10) (a)
	Event.calling
		(x => values.push(x))
		(b)
	a.produce(1)
	a.produce(2)
	assert.equal(values, [ 11, 12 ])
})

test('completes when input event completes', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.map (x => x + 10) (Event.take (2) (a))
	Event.calling
		(x => values.push(x))
		(Event.complete (b))
	a.produce(1)
	a.produce(2)
	a.produce(3)
	// TODO: appropriate value of complete occurrence?
	assert.equal(values, [ 2 ])
})

test.run()
