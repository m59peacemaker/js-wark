import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action } from '../index.js'

const test = suite('Action.map')

test('runs the input function with the value of the input action and has the return value of the input function', () => {
	const a = Action.of (1)
	const b = Action.map (x => x + 1) (a)
	assert.equal(Action.run (b), 2)
})

test.run()
