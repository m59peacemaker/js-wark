import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action } from '../index.js'

const test = suite('Action.chain')

test(`resulting Action's value is the value of the Action resulting from calling the unary input function with the value of the input Action`, () => {
	assert.equal(
		Action.perform (
			Action.chain
				(x => Action.of(x * 10))
				(Action.of (1))
		),
		10
	)
})

test.run()
