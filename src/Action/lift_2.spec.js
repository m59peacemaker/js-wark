import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action } from '../index.js'

const test = suite('Action.lift_2')

test(
	`resulting Action's value is the result of calling the input binary function with the value of the first input sample and the second input sample`,
	() => {
		assert.equal(
			Action.perform (
				Action.lift_2
					(x => y => x + y)
					(Action.of (2))
					(Action.of (3))
			),
			5
		)
	}
)

test.run()
