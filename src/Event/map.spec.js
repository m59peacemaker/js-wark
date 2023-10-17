import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event } from '../index.js'

const test = suite('Event.map')

test('occurs when input event occurs, with input event value transformed by f', () => {
	const values = []
	const a = Event.create()
	const b = Event.map (x => x + 10) (a)
	Event.calling
		(x => values.push(x))
		(b)
	a.produce(1)
	a.produce(2)
	assert.equal(values, [ 11, 12 ])
})

test.run()
