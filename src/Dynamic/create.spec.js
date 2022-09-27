import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic } from '../index.js'

const test = suite('Dynamic.create')

test('initially has the input value', () => {
	const a = Dynamic.create(0)
	assert.equal(Dynamic.get(a), 0)
})

test('has .updates property with .produce method that updates the value', () => {
	const a = Dynamic.create(0)
	assert.equal(Dynamic.get(a), 0)
	a.updates.produce(1)
	assert.equal(Dynamic.get(a), 1)
})

test.run()
