import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'
import { gc } from '../test/util.js'

const test = suite('Event.hold')

test('value is initially the input initial value', () => {
	const a = Event.exposed_producer()
	const b = Event.hold (0) (a)
	assert.equal(b.run(), 0)
})

test('value updates simultaneously with the input event', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.hold (0) (a)
	Event.calling (() => values.push(b.run())) (a)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal(values, [ 1, 2, 3 ])
})

test('unobserves input event when it completes', async () => {
	const values = []
	const a = Event.exposed_producer()
	const a1 = Event.once (a)
	const b = Event.hold (0) (a1)
	Event.calling (() => values.push(b.run())) (a1)

	assert.ok(a1.observers.size > 0)
	assert.ok(b.updates.observers.size > 0)
	a.produce (1)
	assert.equal(values, [ 1 ])
	assert.equal(a1.observers.size, 0)
	assert.equal(b.updates.observers.size, 0)
	a.produce (2)
	a.produce (3)
	assert.equal(values, [ 1 ])
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
