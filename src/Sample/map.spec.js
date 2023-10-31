import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Sample } from '../index.js'

const test = suite('Sample.map')

test(`resulting Sample's value is the resulting of calling the unary input function with the value of the input Sample`, () => {
	assert.equal(
		Sample.get (
			Sample.map
				(x => x * 10)
				(Sample.of (1))
		),
		10
	)
})

test.run()
