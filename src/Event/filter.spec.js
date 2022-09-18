import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

const test = suite('Event.filter')

test('occurs when input event occurs if predicate function returns true for input event value', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.filter (x => x % 2 === 0) (a)
	Event.calling
		(x => values.push(x))
		(b)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	a.produce(4)
	assert.equal(values, [ 2, 4 ])
})

test.run()
