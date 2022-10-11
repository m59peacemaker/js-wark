import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Sample } from '../index.js'
import { promise_wait } from '../test/util.js'

const test = suite('Sample.iso8601_timestamp')

test('has one value per instant', async () => {
	const i1 = Symbol()
	const v1 = Sample.iso8601_timestamp.run(i1)
	assert.equal(
		v1,
		Sample.iso8601_timestamp.run(i1)
	)
	assert.equal(
		[ v1, v1, v1 ],
		[
			Sample.iso8601_timestamp.run(i1),
			Sample.iso8601_timestamp.run(i1),
			Sample.iso8601_timestamp.run(i1)
		]
	)
	await promise_wait(2)
	const i2 = Symbol()
	const v2 = Sample.iso8601_timestamp.run(i2)
	assert.not.equal(v1, v2)
	assert.equal(
		v2,
		Sample.iso8601_timestamp.run(i2)
	)
})

test.run()
