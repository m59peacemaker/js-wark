import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Action, Effect } from '../index.js'

const test = suite('Effect.of')

test(`resulting Effect's value always has the input value`, () => {
	const ten = Effect.of(10)
	assert.equal(Action.perform (ten), 10)
	assert.equal(Action.perform (ten), 10)
})

test.run()
