import { test } from 'zora'
import * as Event from '../Event'
import * as Dynamic from './'
import { rightNow } from '../'
import { add, valuesOf } from '../utils'

test('Dynamic', t => {
	const actual = rightNow(({ dynamicOf }) => {
		const a = dynamicOf(0)
		const b = Dynamic.map (add(1)) (a)
		t.equal(b.sample(), 1)
		return valuesOf(b)
	})
	t.equal(actual(), [ 1 ])

	t.test('Dynamic.hold', t => {
		const actual = rightNow(({ eventOf, dynamicOf }) => {
			const event = eventOf(1, 2, 3)
			const dynamic = Dynamic.hold (0) (event)
			return valuesOf(dynamic)
		})
		t.equal(actual(), [ 0, 1, 2, 3 ])
	})

	t.test('Dynamic.filter', t => {
		//const event = Event.create()
		//const dynamic = Dynamic.hold(0) (event)
		//const filtered = Dynamic.filter (v => v > 2) (dynamic)

		//const dynamicActual = valuesOf(dynamic)
		//const filteredActual = valuesOf(filtered)

		// event.emit(1)
		// event.emit(2)
		// event.emit(3)
		// event.emit(4)

		// t.equal(dynamicActual(), [ 0, 1, 2, 3, 4 ])
		// t.equal(filteredActual(), [ 3, 4 ])
	})
})

// test('Dynamic.fromEmitter dynamic has initial value', t => {
// 	const e = Emitter.create()
// 	const o = Dynamic.fromEmitter ('foo') (e)
// 	t.equal(o.get(), 'foo')
// 	t.end()
// })

// test('Dynamic.fromEmitter dynamic gets new value from emitter', t => {
// 	const e = Emitter.create()
// 	const o = Dynamic.fromEmitter ('foo') (e)
// 	t.equal(o.get(), 'foo')
// 	e.emit('bar')
// 	t.equal(o.get(), 'bar')
// 	e.emit('baz')
// 	t.equal(o.get(), 'baz')
// 	t.end()
// })

// test('Dynamic.fromEmitter dynamic observer gets dynamic values', t => {
// 	const expected = [ 'foo', 'bar', 'baz' ]
// 	t.plan(expected.length)

// 	const e = Emitter.create()
// 	const o = Dynamic.fromEmitter ('foo') (e)
// 	o.subscribe(value => t.equal(value, expected.shift()))
// 	e.emit('bar')
// 	e.emit('baz')
// })
