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

test('Emitter.concatAll makes an emitter that emits when any of the given emitters emit', t => {
	const a = Emitter.create()
	const b = Emitter.create()
	const c = Emitter.create()
	const d = Emitter.concatAll([ a, b, c ])
	const actual = collectValues(d)

	b.emit('foo')
	a.emit('bar')
	c.emit('baz')
	a.emit('qux')

	t.deepEqual(actual(), [ 'foo', 'bar', 'baz', 'qux' ])
})

test('Emitter.filter makes an emitter that emits when then given emitter emits with a value passing the given predicate', t => {
	const word = Emitter.create()
	const shortWord = Emitter.filter (v => v.length <= 3) (word)
	const actual = collectValues(shortWord)

	word.emit('things')
	word.emit('stuff')
	word.emit('foo')
	word.emit('whatever')
	word.emit('bar')

	t.deepEqual(actual(), [ 'foo', 'bar' ])
})

test('Emitter.fold accumulates', t => {
	const a = Emitter.create()
	const b = Emitter.fold (v => acc => acc.concat(v)) ([]) (a)
	const actual = collectValues(b)

	a.emit(1),
	a.emit(2),
	a.emit(3)

	t.deepEqual(actual(), [
		[ 1 ],
		[ 1, 2 ],
		[ 1, 2, 3 ]
	])
})

test('Emitter.bufferTo', t => {
	const notifier = Emitter.create()
	const source = Emitter.create()
	const buffered = Emitter.bufferTo (notifier) (source)
	const actual = collectValues(buffered)

	source.emit(1)
	source.emit(2)
	source.emit(3)
	notifier.emit()
	source.emit(4)
	notifier.emit()
	source.emit(5)
	source.emit(6)
	notifier.emit()
	source.emit(7)

	t.deepEqual(actual(), [ [ 1, 2, 3 ], [ 4 ], [ 5, 6 ] ])
})

test('Emitter.switchMap', t => {
	const emitterNameEmitter = Emitter.create()
	const a = Emitter.create()
	const b = Emitter.create()
	const emitters = { a, b }

	const c = Emitter.switchMap(name => emitters[name]) (emitterNameEmitter)
	const actual = collectValues(c)

	emitterNameEmitter.emit('a')
	a.emit('foo')
	emitterNameEmitter.emit('b')
	a.emit('bar')
	b.emit('baz')
	a.emit('qux')
	emitterNameEmitter.emit('a')
	a.emit('fooz')

	t.deepEqual(actual(), [ 'foo', 'baz', 'fooz' ])
})
