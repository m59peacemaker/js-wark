import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event } from '../index.js'

const test = suite('Event.count')

test('starts with a value of 0 and updates to the next integer each time the input event occurs', () => {
	const update_values = []

	const a = Event.exposed_producer()
	const b = Event.count (a)
	Event.calling (x => update_values.push(x)) (Dynamic.updates(b))

	assert.equal(Dynamic.get(b), 0)
	a.produce('a')
	assert.equal(Dynamic.get(b), 1)
	a.produce('b')
	assert.equal(Dynamic.get(b), 2)
	a.produce('c')
	assert.equal(Dynamic.get(b), 3)

	assert.equal(update_values, [ 1, 2, 3 ])
})

test.run()
