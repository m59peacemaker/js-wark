import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Sample } from '../index.js'

const test = suite('Sample.lift_2')

test(
	`resulting Sample's value is the result of calling the input binary function with the value of the first input sample and the second input sample`,
	() => {
		assert.equal(
			Sample.get (
				Sample.lift_2
					(x => y => x + y)
					(Sample.of (2))
					(Sample.of (3))
			),
			5
		)
	}
)

test.run()
