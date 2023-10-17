import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'
import { promise_wait } from '../test/util/promise_wait.js'

const test = suite('Event.wait')

/*
	TODO:
	It would be nice to somehow test that:
		- it gets cleaned up when not referenced
		- it doesn't get cleaned up while referenced
*/

test('occurs at or soon after the start time plus the input ms', async () => {
	const values = []
	const ms = 25
	const start_time = performance.now()
	Event.calling
		(() => values.push(performance.now() - start_time))
		(Event.wait ({ ms }))
	await promise_wait({ ms: ms * 4 })
	assert.equal(values.length, 1, 'occurred once')
	assert.ok(values[0] >= ms - 1, `occurred at or after the start time plus the input ms ${ms}: took ${values[0]}`)
	assert.ok(values[0] < (ms * 1.3), `did not occur much later than start time plus the input ms ${ms}: took ${values[0]}`)
})

test.run()
