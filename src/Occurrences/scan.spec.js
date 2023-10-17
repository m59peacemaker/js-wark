import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Occurrences, Variable, Sample } from '../index.js'

const test = suite('Occurrences.scan')

test('starts with the initial value and updates to the result of the reducer when the input event occurs', () => {
	const update_values = []

	const a = Occurrences.create ()
	const b = Occurrences.scan (a => b => a + b) (0) (a)
	Occurrences.calling (x => update_values.push(x)) (Variable.updates(b))

	assert.equal(Sample.get(b), 0)
	a.produce(1)
	assert.equal(Sample.get(b), 1)
	a.produce(2)
	assert.equal(Sample.get(b), 3)
	a.produce(3)
	assert.equal(Sample.get(b), 6)

	assert.equal(update_values, [ 1, 3, 6 ])
})

test.skip('completes when the input event completes', () => {
	const update_values = []

	const a = Occurrences.create()
	const b = Occurrences.scan (a => b => b) (0) (Occurrences.take (2) (a))
	const c = Occurrences.completion (Variable.updates(b))

	Occurrences.calling (x => update_values.push(x)) (c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal(update_values, [ 2 ])
})

test.skip('', () => {
	const foo = initial_value => event =>
		Reference.forward_referencing (x =>
			Occurrences.hold
			(initial_value)
			(Occurrences.tag (x) (event))
		)

	const a = Occurrences.create()
	const b = foo (0) (a)

	assert.equal (Sample.get (b), 0)
	a.produce (1)
	assert.equal (Sample.get (b), 0)
	a.produce (2)
	assert.equal (Sample.get (b), 0)
})

test.run()
