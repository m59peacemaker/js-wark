import { test } from 'zora'
import * as Behavior from './'
import * as Event from '../Event'
import { add, identity, collectValues } from '../utils'
import { Time } from '../Time'

test('Behavior', async t => {
	await t.test('behavior.sample()', t => {
		const values = [ 'a', 'b', 'c' ]
		const time = Time()
		const b = Behavior.create(time, () => values.shift())
		t.equal(time.current(), 0)
		t.equal(b.sample(), 'a')
		t.equal(b.sample(), 'a')
		time.forward()
		t.equal(time.current(), 1)
		t.equal(b.sample(), 'b')
		t.equal(b.sample(), 'b')
		t.equal(b.sample(), 'b')
		time.forward()
		t.equal(b.sample(), 'c')
	})

	await t.test('Behavior.proxy', t => {
		const time = Time()
		const event = Event.create(time)
		const proxy = Behavior.proxy(time)
		const snapshot = Event.snapshot (b => a => [ ...b, a ]) (proxy) (event)
		const hold = proxy.mirror (Behavior.hold ([]) (snapshot))
		time.start()
		t.deepEqual(hold.sample(), [])
		event.emit(1)
		t.deepEqual(hold.sample(), [ 1 ])
		event.emit(2)
		t.deepEqual(hold.sample(), [ 1, 2 ])
	})
	await t.test('Behavior.of creates a constant', t => {
		const b = Behavior.of(0)
		t.deepEqual(
			[ b.sample(), b.sample() ],
			[ 0, 0 ]
		)
	})
	await t.test('Behavior.map', t => {
		const time = Time()
		const values = [ 0, 1 ]
		const b = Behavior.map (add(1)) (Behavior.create(time, () => values.shift()))
		t.equal(b.sample(), 1)
		t.equal(b.sample(), 1)
		time.forward()
		t.equal(b.sample(), 2)
		t.equal(b.sample(), 2)
	})

	await t.test('Behavior.lift', t => {
		const time = Time()
		const b = Behavior.lift ((a, b) => a + b) ([ Behavior.of(3), Behavior.of(6) ])
		t.equal(b.sample(), 9)
	})

	await t.test('Behavior.fold', t => {
		const time = Time()
		const e = Event.create(time)
		const b = Behavior.fold (a => b => [ ...a, b ]) ([]) (e)
		time.start()
		t.equal(b.sample(), [])
		e.emit(1)
		t.equal(b.sample(), [ 1 ])
		e.emit(4)
		t.equal(b.sample(), [ 1, 4 ])
		e.emit(10)
		t.equal(b.sample(), [ 1, 4, 10 ])
	})

	await t.test('two events occurring at the same time and tagged with the same behavior have the same value', t => {
		const time = Time()
		const eventA = Event.create(time)
		const randomBehavior = Behavior.create(time, () => Math.random())
		const randomEventA1 = Event.tag (randomBehavior) (eventA)
		const randomEventA2 = Event.tag (randomBehavior) (eventA)

		const actualA1 = collectValues(randomEventA1)
		const actualA2 = collectValues(randomEventA2)

		eventA.emit(1)
		eventA.emit(2)
		eventA.emit(3)

		t.deepEqual(actualA1(), actualA2(), actualA1())
	})
})
