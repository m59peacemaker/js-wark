import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Sample } from '../index.js'
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

test('completes', async () => {
	const values = []
	const ms = 25
	const a = Event.wait ({ ms })
	Event.calling (x => values.push (x)) (Event.completion (a))
	await promise_wait({ ms: ms * 4 })
	assert.equal(Sample.get (Event.completed (a)), true)
	assert.equal(values, [ true ])
})

test('completes simultaneously with its occurrence', async () => {
	const values = []
	const ms = 25
	const a = Event.wait ({ ms })
	Event.calling
		(x => values.push (x))
		(Event.merge_2
			(a => b => [ a, b ])
			(a)
			(Event.completion (a))
		)
	await promise_wait({ ms: ms * 4 })
	assert.equal(Sample.get (Event.completed (a)), true)
	assert.equal(values, [ [ 25, true ] ])
})

test.run()
