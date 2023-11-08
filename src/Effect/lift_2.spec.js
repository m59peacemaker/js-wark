import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action, Effect } from '../index.js'

const test = suite('Effect.lift_2')

test(
	`resulting Effect's value is the result of calling the input binary function with the value of the first input sample and the second input sample`,
	() => {
		assert.equal(
			Action.perform (
				Effect.lift_2
					(x => y => x + y)
					(Effect.of (2))
					(Effect.of (3))
			),
			5
		)
	}
)

test.run()
