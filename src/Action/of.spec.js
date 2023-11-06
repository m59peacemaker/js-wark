import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action } from '../index.js'

const test = suite('Action.of')

test(`resulting Action's value always has the input value`, () => {
	const ten = Action.of(10)
	assert.equal(Action.perform (ten), 10)
	assert.equal(Action.perform (ten), 10)
})

test.run()
