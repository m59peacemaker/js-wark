import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action, Effect } from '../index.js'

const test = suite('Effect.map')

test(`resulting Effect's value is the resulting of calling the unary input function with the value of the input Effect`, () => {
	assert.equal(
		Action.perform (
			Effect.map
				(x => x * 10)
				(Effect.of (1))
		),
		10
	)
})

test.run()
