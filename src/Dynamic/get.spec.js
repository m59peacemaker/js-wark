import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Reference } from '../index.js'

const test = suite('Dynamic.get')

test('returns the current value of a dynamic', () => {
	const a = Dynamic.create(0)
	assert.equal (Dynamic.get(a), 0)
})

test('returns the current value when the dynamic is a forward reference that has been assigned', () => {
	const a = Reference.create()
	a.assign(Dynamic.create(0))
	assert.equal (Dynamic.get(a), 0)
})

// TODO: throw a specific Error
test('throws <TODO: specific error here> when the dynamic is a forward reference that has not been assigned', () => {
	const a = Reference.create()
	assert.throws(() => Dynamic.get(a))
})

test.run()
