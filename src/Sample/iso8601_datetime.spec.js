import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Sample } from '../index.js'
import { promise_wait } from '../test/util/promise_wait.js'
import { iso8601_datetime_regex } from '../test/util/iso8601_datetime_regex.js'

const test = suite('Sample.iso8601_datetime')

test('value is a iso8601 datetime string', () => {
	assert.ok(iso8601_datetime_regex.test(Sample.get(Sample.iso8601_datetime)))
})

test('has the same value in the same instant of time', () => {
	const values = []
	const a = Event.create()

	Event.calling
		(x => values.push(x))
		(Event.merge_2
			(a => b => [ a, b ])
			(Event.tag (Sample.iso8601_datetime) (a))
			(Event.tag (Sample.iso8601_datetime) (a))
		)
	a.produce()
	assert.equal(values.length, 1)
	assert.equal(values[0][0], values[0][1])
})

test('has different values at instants that occur at different ms of time', async () => {
	const values = []
	const a = Event.create()

	Event.calling
		(x => values.push(x))
		(Event.tag (Sample.iso8601_datetime) (a))
	a.produce()
	await promise_wait ({ ms: 50 })
	a.produce()
	assert.not.equal(values[0], values[1])
})

test('refers to the same time as unix_timestamp_ms within the same instant', () => {
	const values = []
	const a = Event.create()

	Event.calling
		(x => values.push(x))
		(Event.merge_2
			(a => b => [ a, b ])
			(Event.tag (Sample.unix_timestamp_ms) (a))
			(Event.tag (Sample.iso8601_datetime) (a))
		)
	a.produce()
	assert.equal(values.length, 1)
	assert.equal(new Date(values[0][0]).toISOString(), values[0][1])
})

test.run()
