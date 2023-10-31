import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Sample } from '../index.js'

const test = suite('Sample.chain')

test(`resulting Sample's value is the value of the Sample resulting from calling the unary input function with the value of the input Sample`, () => {
	assert.equal(
		Sample.get (
			Sample.chain
				(x => Sample.of(x * 10))
				(Sample.of (1))
		),
		10
	)
})

test.run()
