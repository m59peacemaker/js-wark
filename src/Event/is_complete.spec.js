import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Dynamic } from '../index.js'
import { gc } from '../test/util.js'

const test = suite('Event.is_complete')

test('is_complete of a forward reference has an initial value of true when the assigned event is complete', () => {
	const a = Event.forward_reference()
	const b = Event.is_complete (a)
	const c = Dynamic.map (x => x ? 1 : 0) (b)
	a.assign (Event.never)
	assert.equal(true, Dynamic.run(c))
})

test.run()
