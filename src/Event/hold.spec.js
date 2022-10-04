import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { gc } from '../test/util.js'
import { Dynamic, Event } from '../index.js'

const test = suite('Event.hold')

test('value is initially the input initial value', () => {
	const a = Event.exposed_producer()
	const b = Event.hold (0) (a)
	assert.equal(b.run(), 0)
})

test('value is unchanged in the instant the update event is occurring and is the update event value in the subsequent instant', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.hold (0) (a)
	Event.calling (() => values.push(Dynamic.get(b))) (a)

	a.produce(1)
	assert.equal(Dynamic.get(b), 1)
	a.produce(2)
	assert.equal(Dynamic.get(b), 2)
	a.produce(3)
	assert.equal(Dynamic.get(b), 3)

	assert.equal(values, [ 0, 1, 2 ])
})

test(
	'when the update event is occurring in the same instant the dynamic is created, the dynamic has its initial value in that instant and the update event value in the subsequent instant',
	() => {
		let b
		let initial_value
		const a = Event.exposed_producer()
		Event.calling
			(() => {
				b = Event.hold (false) (a)
				initial_value = Dynamic.get(b)
			})
			(Event.take (1) (a))
		a.produce(true)
		assert.equal(initial_value, false)
		assert.equal(Dynamic.get(b), true)
		a.produce(false)
		assert.equal(Dynamic.get(b), false)
	}
)

test('<implementation detail> unobserves input event when it completes', async () => {
	const values = []
	const a = Event.exposed_producer()
	const a1 = Event.once (a)
	const b = Event.hold (0) (a1)
	Event.calling (() => values.push(Dynamic.get(b))) (a1)

	assert.ok(a1.observers.size > 0)
	assert.ok(b.updates.observers.size > 0)
	a.produce (1)
	assert.equal(values, [ 0 ])
	assert.equal(a1.observers.size, 0)
	assert.equal(b.updates.observers.size, 0)
	a.produce (2)
	a.produce (3)
	assert.equal(values, [ 0 ])
})

/*
	TODO: this kind of test is unreliable, because forcing garbage collection doesn't force FinalizationRegistry callbacks to be called
	It might be best if `a` holds `a` weak reference to b's observer and b's observer is contingent only on `b`, so that b and its observer of `a` get garbage collected together,
	with no need for the finalization registry.
*/
test.skip('unobserves input event when garbage collected', async () => {
	const a = Event.exposed_producer()
	const b = Event.hold (0) (a)
	a.produce(1)
	assert.equal(b.run(), 1)
	assert.equal(a.observers.size, 1)
	await gc()
	assert.equal(a.observers.size, 0)
})

test.run()
