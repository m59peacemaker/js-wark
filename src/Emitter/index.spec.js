import { test } from 'zora'
import * as Emitter from './'
import { collectValues } from '../util'

test('Emitter.emit emits to subscriber', t => {
	const emitter = Emitter.create()
	const actual1 = collectValues(emitter)
	const actual2 = collectValues(emitter)
	emitter.emit(5)
	emitter.emit(10)
	t.deepEqual(actual1(), [ 5, 10 ])
	t.deepEqual(actual2(), [ 5, 10 ])
})

test('emitter.subscribe returns unsubscribe that unsubscribes', t => {
	const emitter = Emitter.create()
	let values = []
	const unsubscribe = emitter.subscribe(v => values.push(v))
	emitter.emit(123)
	t.deepEqual(values, [ 123 ])
	unsubscribe()
	emitter.emit(456)
	t.deepEqual(values, [ 123 ])
})

test('Emitter.map emits with mapped value', t => {
	const n = Emitter.create()
	const nSquared = Emitter.map (n => n * n) (n)
	const actual = collectValues(nSquared)
	n.emit(2)
	n.emit(3)
	t.deepEqual(actual(), [ 4, 9 ])
})

test('Emitter.switchMap', t => {
	t.test('', t => {
		const emitterNameEmitter = Emitter.create()
		const a = Emitter.create()
		const b = Emitter.create()
		const emitters = { a, b }

		const c = Emitter.switchMap(name => emitters[name]) (emitterNameEmitter)
		const actual = collectValues(c)

		emitterNameEmitter.emit('a')
		a.emit('foo')
		emitterNameEmitter.emit('b')
		a.emit('x')
		b.emit('bar')
		a.emit('x')
		emitterNameEmitter.emit('a')
		a.emit('baz')

		t.deepEqual(actual(), [ 'foo', 'bar', 'baz' ])
	})

	t.test('', t => {
		const a = Emitter.create()
		const b = Emitter.create()
		const c = Emitter.create()
		const emitters = { b, c }
		const d = Emitter.create()
		const e = Emitter.switchMap (v => Emitter.derive ([ a, emitters[v] ]) ((emit, { value }) => emit(value))) (d)
		const actual = collectValues(e)

		d.emit('b')
		a.emit(1)
		b.emit(2)
		c.emit('x')

		d.emit('c')
		a.emit(3)
		b.emit('x')
		c.emit(4)

		d.emit('c')
		a.emit(5)
		b.emit('x')
		c.emit(6)

		t.deepEqual(actual(), [ 1, 2, 3, 4, 5, 6 ])
	})
})
