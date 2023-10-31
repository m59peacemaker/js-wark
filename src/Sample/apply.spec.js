import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Sample } from '../index.js'

const test = suite('Sample.apply')

test(`resulting Sample's value is the resulting of applying the function value of the first input Sample to the value of the second input Sample`, () => {
	assert.equal(
		Sample.get (
			Sample.apply
				(Sample.of (x => x * 10))
				(Sample.of (1))
		),
		10
	)
})

test.run()
