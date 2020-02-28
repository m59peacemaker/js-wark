import { test } from 'zora'
import * as Emitter from './'
import delay from 'delay'
import { collectValues } from '../utils'

// test(
// 	`Emitter.create fn can emit and subscribers can subscribe'`,
// 	async t => {
// 		let pass = false
// 		const emitter = Emitter.create(async emit => emit(true))
// 		emitter.subscribe(value => pass = value)
// 		await Promise.resolve()
// 		t.equal(pass, true)
// 	}
// )

// test('Emitter.of(...values) emits each given value', async t => {
// 	const emitter = Emitter.of(1, 2, 3 )
// 	const expected =  [ 1, 2, 3 ]
// 	emitter.subscribe(value => t.equal(value, expected.shift()))
// })

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
	const unsubscribe = emitter.subscribe(v => t.equal(v, 123))
	emitter.emit(123)
	unsubscribe()
	emitter.emit(456)
})

// test('emitter.unsubscribeAll unsubscribes all', t => {
// 	const emitter = Emitter.create()
// 	emitter.subscribe(v => t.equal(v, 123))
// 	emitter.subscribe(v => t.equal(v, 123))
// 	await emitter.emit(123)
// 	emitter.unsubscribeAll()
// 	emitter.emit(456)
// })

// test('emitter() can be used to emit', async t => {
// 	const emitter = Emitter.create()
// 	emitter.subscribe(v => t.equal(v, 123))
// 	await emitter(123)
// })

test('Emitter.map emits with mapped value', t => {
	const n = Emitter.create()
	const nSquared = Emitter.map (n => n * n) (n)
	const actual = collectValues(nSquared)
	n.emit(2)
	n.emit(3)
	t.deepEqual(actual(), [ 4, 9 ])
})

test('Emitter.concat makes an emitter that emits when either given emitter emits', t => {
	const a = Emitter.create()
	const b = Emitter.create()
	const c = Emitter.concat (a) (b)
	const actual = collectValues(c)
	b.emit('foo')
	a.emit('bar')
	t.deepEqual(actual(), [ 'foo', 'bar' ])
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

test('Emitter.scan accumulates', t => {
	const a = Emitter.create()
	const b = Emitter.scan (v => acc => acc.concat(v)) ([]) (a)
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

test('Emitter.recentN', t => {
	const a = Emitter.create()
	const b = Emitter.recentN (4) (a)
	const actual = collectValues(b)

	;[ 1, 2, 3, 4, 5, 6 ].map(a.emit)

	t.deepEqual(actual(), [
		[ 1 ],
		[ 1, 2 ],
		[ 1, 2, 3 ],
		[ 1, 2, 3, 4 ],
		[ 2, 3, 4, 5 ],
		[ 3, 4, 5, 6 ]
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

test('Emitter.flatten makes an emitter that emits when emitters emited from the given emitter (inner emitters) emit', t => {
	const emitterEmitter = Emitter.create()
	const a = Emitter.create()
	const b = Emitter.create()
	const flattenedEmitter = Emitter.flatten(emitterEmitter)
	const actual = collectValues(flattenedEmitter)

	emitterEmitter.emit(a)
	a.emit('foo')
	emitterEmitter.emit(b)
	a.emit('bar')
	b.emit('baz')
	a.emit('qux')
	emitterEmitter.emit(a)
	a.emit('fooz')

	t.deepEqual(actual(), [ 'foo', 'bar', 'baz', 'qux', 'fooz', 'fooz' ])
})

test('Emitter.flatMap', t => {
	const emitterNameEmitter = Emitter.create()
	const a = Emitter.create()
	const b = Emitter.create()
	const emitters = { a, b }

	const flattenedEmitter = Emitter.flatMap (name => emitters[name]) (emitterNameEmitter)
	const actual = collectValues(flattenedEmitter)

	emitterNameEmitter.emit('a')
	a.emit('foo')
	emitterNameEmitter.emit('b')
	a.emit('bar')
	b.emit('baz')
	a.emit('qux')
	emitterNameEmitter.emit('a')
	a.emit('fooz')

	t.deepEqual(actual(), [ 'foo', 'bar', 'baz', 'qux', 'fooz', 'fooz' ])
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

test('Emitter.switchLatest', t => {
	const emitterEmitter = Emitter.create()
	const a = Emitter.create()
	const b = Emitter.create()
	const emitters = { a, b }

	const c = Emitter.switchLatest (emitterEmitter)
	const actual = collectValues(c)

	emitterEmitter.emit(a)
	a.emit('foo')
	emitterEmitter.emit(b)
	a.emit('bar')
	b.emit('baz')
	a.emit('qux')
	emitterEmitter.emit(a)
	a.emit('fooz')

	t.deepEqual(actual(), [ 'foo', 'baz', 'fooz' ])
})

// test('Emitter.bufferN', async t => {
// 	await t.test('bufferN (4) (1)', async t => {
// 		const expected = [
// 			[ 1, 2, 3, 4 ],
// 			[ 2, 3, 4, 5 ],
// 			[ 3, 4, 5, 6 ]
// 		]
// 		const actual = []

// 		const a = Emitter.create()
// 		const b = Emitter.bufferN (4) (1) (a)

// 		b.subscribe(value => actual.push(value))

// 		await Promise.all([ 1, 2, 3, 4, 5, 6 ].map(a.emit))

// 		t.deepEqual(actual, expected)
// 	})

// 	t.test('bufferN (3) (3)', async t => {
// 		const expected = [
// 			[ 1, 2, 3 ],
// 			[ 4, 5, 6 ],
// 			[ 7, 8, 9 ]
// 		]
// 		const actual = []

// 		const a = Emitter.create()
// 		const b = Emitter.bufferN (3) (3) (a)

// 		b.subscribe(value => actual.push(value))

// 		await Promise.all([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ].map(a.emit))
		
// 		t.deepEqual(actual, expected)
// 	})
// 	return
// 	t.test('bufferN (3) (2)', async t => {
// 		const expected = [
// 			[ 1, 2, 3 ],
// 			[ 3, 4, 5 ],
// 			[ 5, 6, 7 ]
// 		]

// 		const a = Emitter.create()
// 		const b = Emitter.bufferN (3) (2) (a)

// 		b.subscribe(value => t.deepEqual(value, expected.shift()))

// 		;[ 1, 2, 3, 4, 5, 6, 7, 8 ].forEach(a.emit)
// 	})

// 	t.test('bufferN (2) (4)', t => {
// 		const expected = [
// 			[ 1, 2 ],
// 			[ 5, 6 ],
// 			[ 9, 10 ]
// 		]
// 		t.plan(expected.length)

// 		const a = Emitter.create()
// 		const b = Emitter.bufferN (2) (4) (a)

// 		b.subscribe(value => t.deepEqual(value, expected.shift()))

// 		;[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ].forEach(a.emit)
// 	})
// })

// test('Emitter.pairwise', t => {
// 	const expected = [
// 		[ 1, 2 ],
// 		[ 2, 3 ],
// 		[ 3, 4 ]
// 	]
// 	t.plan(expected.length)
// 	const a = Emitter.create()
// 	const b = Emitter.pairwise(a)

// 	b.subscribe(value => t.deepEqual(value, expected.shift()))

// 	;[ 1, 2, 3, 4 ].forEach(a.emit)
// })
