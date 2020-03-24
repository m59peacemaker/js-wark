import { test } from 'zora'
import * as Event from './'
import * as Behavior  from '../Behavior'
import * as Dynamic from '../Dynamic'
import { add, identity, collectValues, pipe } from '../util'

// TODO: clean up this trainwreck of a file

test('Event', t => {
	t.test('event.t()', t => {
		// Some extremely bad things are about to go down in this test. DO NOT DO SUCH THINGS IN YOUR APPLICATION CODE. EVER. EVER. EVEREST.
		// DO NOT DO IT.
		const a = Event.create()
		const at = Behavior.create(a.t)
		t.equal(a.t(), null)
		t.equal(at.sample(a.t()), null)
		a.occur()
		const t0 = a.t()
		t.equal(typeof t0, 'symbol', 't is a symbol')
		t.equal(t0 === null ? false : Number.isInteger(Number(t0.description)), true, 't description value is a string of an integer')
		t.equal(a.t(), at.sample(t0))
		t.equal(a.t(), at.sample(t0))
		a.occur()
		const t1 = a.t()
		t.notEqual(t0, t1, 'event t changes on occurrence')
		t.equal(t1, at.sample(t1), 'sampling a behavior with new t gets updated behavior value')
		t.equal(t1, at.sample(t1), 'sampling a behavior with the same/current t gets same behavior value')
	})
	t.test('event() can be called as event.occur()', t => {
		const a = Event.create()
		const actual = collectValues(a)
		a(1)
		a.occur(2)
		a(3)
		t.deepEqual(actual(), [ 1, 2, 3 ])
	})
	// TODO:
	t.skip('generate multiple new moments from one moment and buffer them back to one moment', t => {
		// Event(List(Occurrence(List(1, 2, 3)))) event with list of one occurrence with a list of 3 values
		const a = Event.create()
		// Event(List(Occurrence(1), Occurrence(2), Occurrence(3))) Event with a list of 3 occurrences each with one value
		// @ts-ignore
		const b = Event.switchMap (list => Event.magicTimePowersX (...list)) (a)
		const c = Event.concatAll([ a, b ])
		// @ts-ignore
		const d = Event.bufferN (3) (1) (b)
		const e = Event.concatAll ([ a, d ])
		const f = Event.combineAllWith (v => v) ([ a, b, d ])
		const actualB = collectValues(b)
		const actualC = collectValues(c)
		const actualD = collectValues(d)
		const actualE = collectValues(e)
		const actualF = collectValues(f)

		a.occur(1)
		a.occur(2)
		a.occur(3)

		t.deepEqual(actualB(), [ 1, 2, 3 ])
		t.deepEqual(actualC(), [ [ 1, 2, 3 ], 1, 2, 3 ])
		t.deepEqual(actualD(), [ [ 1, 2, 3 ] ])
		t.deepEqual(actualE(), [ [ 1, 2, 3 ], [ 1, 2, 3 ] ])
		t.deepEqual(actualF(), [
			{ 0: [ 1, 2, 3 ] },
			{ 1: 1 },
			{ 1: 2 },
			{ 1: 3, 2: [ 1, 2, 3 ] },
		])
	})

	// TODO:
	// Event.promiseOfN ? instead of/in addition to promiseNext
	// 1. finish the current state of things just using promiseNext, copying the fn out to files where it is needed and leave todos on those
	// 2. make some kind of transduce/reduce - need short circuiting/completion
	// would be better to use Event.toPromise(Event.take(10))

	/*
	// TODO: this belongs in Dynamic tests
	// TODO: actually, maybe doesn't need to even exist
	const promisePending = eventOfPromise => Dynamic.onOff (false) (eventOfPromise) (awaitPromise(eventOfPromise))
	t.test('promisePending', async t => {
		const a = Event.create()
		const b = promisePending (a)
		t.equal(b.sample(), false)
		const p1 = new Promise(resolve => setTimeout(resolve, 50))
		a.occur(p1)
		t.equal(b.sample(), true)
		await p1
		t.equal(b.sample(), false)
		a.occur(p1)
		t.equal(b.sample(), true)
		await new Promise(resolve => setTimeout(resolve, 4))
		t.equal(b.sample(), false)
	})
	*/
	/*const promiseNext = event => new Promise(event.subscribe)
		t.test('Event.promiseNext', async t => {
		const a = Event.create()
		const p = promiseNext(a)
		a.occur('foo')
		t.deepEqual(await p, 'foo')
	})*/
})
