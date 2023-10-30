import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event, Sample } from '../index.js'

const test = suite('Event.scan')

test('starts with the initial value and updates to the result of the reducer when the input event occurs', () => {
	const update_values = []

	const a = Event.create()
	const b = Event.scan (a => b => a + b) (0) (a)
	Event.calling (x => update_values.push(x)) (Dynamic.updates(b))

	assert.equal(Sample.get(b), 0)
	a.produce(1)
	assert.equal(Sample.get(b), 1)
	a.produce(2)
	assert.equal(Sample.get(b), 3)
	a.produce(3)
	assert.equal(Sample.get(b), 6)

	assert.equal(update_values, [ 1, 3, 6 ])
})

test('updates complete when the input event completes', () => {
	const values = []

	const a = Event.create()
	const b = Event.complete_on
		(Event.filter (x => x === 2) (a))
		(a)
	const c = Event.scan
		(a => b => a)
		(0)
		(b)

	Event.calling
		(x => values.push(x))
		(Event.merge_2
			(a => b => [ a, b ])
			(b)
			(Event.completion (Dynamic.updates (c)))
		)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal(values, [ [ 1, Event.nothing ], [ 2, true ] ])
})

test.skip('', () => {
	const foo = initial_value => event =>
		Reference.forward_referencing (x =>
			Event.hold
			(initial_value)
			(Event.tag (x) (event))
		)

	const a = Event.create()
	const b = foo (0) (a)

	assert.equal (Dynamic.get (b), 0)
	a.produce (1)
	assert.equal (Dynamic.get (b), 0)
	a.produce (2)
	assert.equal (Dynamic.get (b), 0)
})

test.run()
