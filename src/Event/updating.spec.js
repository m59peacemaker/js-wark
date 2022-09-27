import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event, Reference } from '../index.js'
import { deferred, eagerly } from './updating.js'

const test = suite('Event.updating')

test('updating (eagerly) value is that of the input event during the instant the input event occurs and subsequent instants', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.updating (eagerly) (0) (a)
	Event.calling (x => values.push(x)) (Event.tag (b) (a))

	a.produce(1)
	assert.equal(Dynamic.get (b), 1)
	a.produce(2)
	assert.equal(Dynamic.get (b), 2)
	a.produce(3)
	assert.equal(Dynamic.get (b), 3)

	assert.equal(values, [ 1, 2, 3 ])
})

test(`updating (deferred) value remains the same during the instant the input event occurs, and is the value of the input event's occurrence in subsequent instants`, () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.updating (deferred) (0) (a)
	Event.calling (x => values.push(x)) (Event.tag (b) (a))

	a.produce(1)
	assert.equal(Dynamic.get (b), 1)
	a.produce(2)
	assert.equal(Dynamic.get (b), 2)
	a.produce(3)
	assert.equal(Dynamic.get (b), 3)

	assert.equal(values, [ 0, 1, 2 ])
})

test.run()
