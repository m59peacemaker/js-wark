import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

const test = suite('Event.count')

test('starts with a value of 0 and updates to the next integer each time the input event occurs', () => {
	const update_values = []

	const a = Event.exposed_producer()
	const b = Event.count (a)
	Event.calling (x => update_values.push(x)) (b.updates)

	assert.equal(b.run(), 0)
	a.produce('a')
	assert.equal(b.run(), 1)
	a.produce('b')
	assert.equal(b.run(), 2)
	a.produce('c')
	assert.equal(b.run(), 3)

	assert.equal(update_values, [ 1, 2, 3 ])
})

test.run()
