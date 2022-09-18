import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'
import { promise_wait } from '../test/util.js'

const test = suite('Event.wait')

/*
	TODO:
	It would be nice to test that:
		it gets cleaned up when not referenced
		it doesn't cleaned up while referenced
*/

test('occurs at or soon after the start time plus the input ms', async () => {
	const values = []
	const ms = 25
	Event.calling
		(start_time => values.push(performance.now() - start_time))
		(Event.wait ({ ms, value: performance.now() }))
	await promise_wait(ms * 4)
	assert.equal(values.length, 1, 'occurred once')
	assert.ok(values[0] >= ms - 1, `occurred at or after the start time plus the input ms ${ms}: took ${values[0]}`)
	assert.ok(values[0] < (ms * 1.3), `did not occur much later than start time plus the input ms ${ms}: took ${values[0]}`)
})

test('occurs and completes simultaneously on its first occurrence', async () => {
	const values = []
	const ms = 25
	const a = Event.wait ({ ms, value: 1 })
	Event.calling
		(x => values.push(x))
		(Event.merge_2_with (a => b => [ a, b ]) (a) (Event.complete (a)))
	await promise_wait(ms)
	assert.equal(values, [ [ 1, 1 ] ])
})

test.run()
