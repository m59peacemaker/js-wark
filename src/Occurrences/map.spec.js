import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Occurrences from './index.js'

const test = suite('Occurrences.map')

test('occurs when input event occurs, with input event value transformed by f', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.map (x => x + 10) (a)
	Occurrences.calling
		(x => values.push(x))
		(b)
	a.produce(1)
	a.produce(2)
	assert.equal(values, [ 11, 12 ])
})

test.run()
