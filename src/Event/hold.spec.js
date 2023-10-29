import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event, Sample } from '../index.js'

const test = suite('Event.hold')

test('value is initially the input initial value', () => {
	const a = Event.create()
	const b = Event.hold (0) (a)
	assert.equal(Sample.get(b), 0)
})

test('value is unchanged in the instant the update event is occurring and is the update event value in the subsequent instant', () => {
	const values = []
	const a = Event.create()
	const b = Event.hold (0) (a)
	Event.calling (() => values.push(Sample.get(b))) (a)

	a.produce(1)
	assert.equal(Sample.get(b), 1)
	a.produce(2)
	assert.equal(Sample.get(b), 2)
	a.produce(3)
	assert.equal(Sample.get(b), 3)

	assert.equal(values, [ 0, 1, 2 ])
})

test(
	'when the update event is occurring in the same instant the dynamic is created, the dynamic has its initial value in that instant and the update event value in the subsequent instant',
	() => {
		let b
		let initial_value
		const a = Event.create()
		Event.calling
			(() => {
				b = Event.hold (false) (a)
				initial_value = Sample.get(b)
			})
			(a)
		a.produce(true)
		assert.equal(initial_value, false)
		assert.equal(Sample.get(b), true)
	}
)

test('Event.tag - value is unchanged in the instant the update event is occurring and is the update event value in the subsequent instant', () => {
	const values_b_updates = []
	const values_c = []
	const a = Event.create()
	const b = Event.hold (0) (a)
	const c = Event.tag (b) (a)
	Event.calling (x => values_b_updates.push(x)) (Dynamic.updates(b))
	Event.calling (x => values_c.push(x)) (c)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	assert.equal(values_b_updates, [ 1, 2, 3 ])
	assert.equal(values_c, [ 0, 1, 2 ])
})

test.run()
