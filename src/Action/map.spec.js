import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action } from '../index.js'

const test = suite('Action.map')

test(`resulting Action's value is the resulting of calling the unary input function with the value of the input Action`, () => {
	assert.equal(
		Action.perform (
			Action.map
				(x => x * 10)
				(Action.of (1))
		),
		10
	)
})

test.run()
