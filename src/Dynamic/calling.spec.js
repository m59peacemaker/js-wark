import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event } from '../index.js'

const test = suite('Dynamic.calling')

test('calls the function with the initial value and update values of the dynamic', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.hold (0) (a)
	Dynamic.calling (x => values.push(x)) (b)
	assert.equal(values,[ 0 ])
	a.produce(1)
	assert.equal(values, [ 0, 1 ])
})

test.run()
