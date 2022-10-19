import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Sample } from '../index.js'
import { promise_wait } from '../test/util/promise_wait.js'

const test = suite('Sample.wait')

test('waits from the same instant for the same duration occur simultaneously', async () => {
	const values = []
	const ms = 25
	const a = Event.create()
	Event.calling
		(x => values.push(x))
		(Event.merge_2_with
			(a => b => [ a, b ])
			(Event.switching (Event.tag (Sample.wait ({ ms })) (a)))
			(Event.switching (Event.tag (Sample.wait ({ ms })) (a)))
		)
	a.produce()
	await promise_wait({ ms: ms * 2 })
	assert.equal(
		values,
		[
			[ ms, ms ]
		]
	)
})

test.run()
