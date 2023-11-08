import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action, Effect } from '../index.js'

const test = suite('Effect.chain')

test(`resulting Effect's value is the value of the Effect resulting from calling the unary input function with the value of the input Effect`, () => {
	assert.equal(
		Action.perform (
			Effect.chain
				(x => Effect.of(x * 10))
				(Effect.of (1))
		),
		10
	)
})

test.run()
