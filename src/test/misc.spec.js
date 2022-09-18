import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Dynamic } from '../index.js'

const test = suite('misc')

// The concern here is whether the tagged event will see the updated value, rather than the old value of the dynamic.
test('deriving Dynamic y from Event x, and then tagging x with y is equivalent to y.updates', () => {
	const values_a = []
	const values_b = []
	const a = Event.exposed_producer()
	const b = Event.hold (0) (a)
	const c = Dynamic.map (x => x + 1) (b)
	const d = Event.tag (c) (a)
	Event.calling (x => values_a.push(x)) (c.updates)
	Event.calling (x => values_b.push(x)) (d)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	assert.equal(values_a, [ 2, 3, 4 ])
	assert.equal(values_b, [ 2, 3, 4 ])
})

test.run()
