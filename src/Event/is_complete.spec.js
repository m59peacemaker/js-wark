import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Dynamic, Reference } from '../index.js'

const test = suite('Event.is_complete')

test('is_complete of a forward reference has an initial value of true when the assigned event is complete', () => {
	const a = Reference.create()
	const b = Event.is_complete (a)
	const c = Dynamic.map (x => x ? 1 : 0) (b)
	a.assign (Event.never)
	assert.equal(Dynamic.get(c), 1)
})

test('is_complete (x) is a Dynamic that is initially false when x is not complete, and true when x is complete', () => {
	const values = []

	const a = Event.exposed_producer()
	const b = Event.take (3) (a)
	const c = Event.is_complete (Event.take (3) (a))

	Event.calling
		(x => values.push(x))
		(Event.merge_array ([ Event.complete(b), Dynamic.updates (c) ]))

	assert.equal(Dynamic.get(c), false)
	a.produce(1)
	assert.equal(Dynamic.get(c), false)
	a.produce(2)
	assert.equal(Dynamic.get(c), false)
	a.produce(3)
	assert.equal(Dynamic.get(c), true)

	assert.equal (values, [ [ 3, true ] ])
})

test.run()
