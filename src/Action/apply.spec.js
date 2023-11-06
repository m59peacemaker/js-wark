import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action } from '../index.js'

const test = suite('Action.apply')

test(`resulting Action's value is the resulting of applying the function value of the first input Action to the value of the second input Action`, () => {
	assert.equal(
		Action.perform (
			Action.apply
				(Action.of (x => x * 10))
				(Action.of (1))
		),
		10
	)
})

test.run()
