import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action, Effect } from '../index.js'

const test = suite('Effect.apply')

test(`resulting Effect's value is the resulting of applying the function value of the first input Effect to the value of the second input Effect`, () => {
	assert.equal(
		Action.perform (
			Effect.apply
				(Effect.of (x => x * 10))
				(Effect.of (1))
		),
		10
	)
})

test.run()
