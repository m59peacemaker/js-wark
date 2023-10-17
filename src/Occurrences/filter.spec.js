import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Occurrences from './index.js'

const test = suite('Occurrences.filter')

test('occurs when input event occurs only if predicate function returns true for input event value', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.filter (x => x % 2 === 0) (a)
	Occurrences.calling
		(x => values.push(x))
		(b)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	a.produce(4)
	assert.equal(values, [ 2, 4 ])
})

test.run()
