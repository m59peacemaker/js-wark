import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action, Event, Task } from '../index.js'
import { promise_wait } from '../test/util.js'

const test = suite('Task.of')

test('', () => {
	const values = []
	Action.run (
		Task.calling (x => values.push(x)) (Task.of (1))
	)

	assert.equal (values, [ 1 ])
})

test.run()
