import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Sample } from '../index.js'

const test = suite('Sample.of')

test(`resulting Sample's value always has the input value`, () => {
	const ten = Sample.of(10)
	assert.equal(Sample.get (ten), 10)
	assert.equal(Sample.get (ten), 10)
})

test.run()
