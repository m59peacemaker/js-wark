// import { test } from 'zora'
// import * as Emitter from './'
// import * as Behavior from '../Behavior'
// import delay from 'delay'


// const a = Emitter.create(emit => {
// 	setInterval(() => {
// 		emit(Date.now())
// 	}, 1000)
// })

// const b = Behavior.hold (Date.now()) (a)
// a.subscribe(a => console.log({ a, b: b.sample() }))
// //a.actualize()

// ;(() => {
// 	const em1 = Emitter.create(emit => {
// 		let n = 0
// 		setInterval(() => {
// 			emit(++n)
// 		}, 1000)
// 	})

// 	const bh1 = Behavior.fold ((a, b) => a + b) (0) (em1)
// 	const bh2 = Behavior.bufferN (3) (3) (em1)
// 	const em2 = Emitter.bufferN (3) (3) (em1)
// 	em1.subscribe(em1 => {
// 		//console.log({ em1, bh1: bh1.sample(), bh2: bh2.sample() })
// 		console.log({ bh2: bh2.sample() })
// 	})
// 	em2.subscribe(em2 => console.log({ em2 }))
// 	em1.actualize()
// })()

// const emitter = Emitter.create(emit => {
// 	emit(123)
// })
// emitter.subscribe()
// emitter.subscribe()
// emitter.subscribe()

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

// test(`emitter.complete is a promise that resolves when the constructor param fn resolves`, async t => {
// 	let x
// 	const emitter = Emitter.create(async emit => {
// 		await delay(1000)
// 		x = 123
// 	})
// 	await emitter.complete
// 	t.equal(x, 123)
// })

// test('Emitter.of(...values) emits each given value', async t => {
// 	const emitter = Emitter.of(1, 2, 3 )
// 	const expected =  [ 1, 2, 3 ]
// 	emitter.subscribe(value => t.equal(value, expected.shift()))
// })

// test('Emitter.emit emits to subscriber', async t => {
// 	const emitter = Emitter.create()
// 	emitter.subscribe(v => t.equal(v, 1))
// 	emitter.subscribe(v => t.equal(v, 1))
// 	await emitter.emit(1)
// })

// test('emitter.subscribe returns unsubscribe that unsubscribes', async t => {
// 	const emitter = Emitter.create()
// 	const unsubscribe = emitter.subscribe(v => t.equal(v, 123))
// 	await emitter.emit(123)
// 	unsubscribe()
// 	await emitter.emit(456)
// })

// test('emitter.unsubscribeAll unsubscribes all', async t => {
// 	const emitter = Emitter.create()
// 	emitter.subscribe(v => t.equal(v, 123))
// 	emitter.subscribe(v => t.equal(v, 123))
// 	await emitter.emit(123)
// 	emitter.unsubscribeAll()
// 	await emitter.emit(456)
// })

// test('emitter() can be used to emit', async t => {
// 	const emitter = Emitter.create()
// 	emitter.subscribe(v => t.equal(v, 123))
// 	await emitter(123)
// })

// test('Emitter.map emits with mapped value', async t => {
// 	const expected = [ 4, 9 ]
// 	const n = Emitter.create()
// 	const nSquared = Emitter.map (n => n * n) (n)
// 	nSquared.subscribe(value => t.equal(value, expected.shift()))
// 	await n.emit(2)
// 	await n.emit(3)
// })

// test('Emitter.alt makes an emitter that emits when either given emitter emits', async t => {
// 	const expected = [ 'foo', 'bar' ]
// 	const a = Emitter.create()
// 	const b = Emitter.create()
// 	const c = Emitter.alt (a) (b)
// 	c.subscribe(value => t.equal(value, expected.shift()))
// 	await b.emit('foo')
// 	await a.emit('bar')
// })

// test('Emitter.combine makes an emitter that emits when any of the given emitters emit', async t => {
// 	const expected = [ 'foo', 'bar', 'baz', 'qux' ]
// 	const actual = []

// 	const a = Emitter.create()
// 	const b = Emitter.create()
// 	const c = Emitter.create()
// 	const d = Emitter.combine([ a, b, c ])

// 	d.subscribe(value => actual.push(value))

// 	await b.emit('foo')
// 	await a.emit('bar')
// 	await c.emit('baz')
// 	await a.emit('qux')

// 	t.deepEqual(actual, expected)
// })

// test('Emitter.combine returns new emitter even if given only one emitter', t => {
// 	const a = Emitter.create()
// 	const d = Emitter.combine([ a ])
// 	t.equal(Object.is(a, d), false)
// })

// // TODO: type checking should disallow this altogether
// test('Emitter.combine returns new emitter even if given empty array', async t => {
// 	const expected = [ 123 ]
// 	const d = Emitter.combine([])
// 	d.subscribe(value => t.equal(value, expected.shift()))
// 	await d.emit(123)
// })

// test('Emitter.filter makes an emitter that emits when then given emitter emits with a value passing the given predicate', async t => {
// 	const expected = [ 'foo', 'bar' ]

// 	const word = Emitter.create()
// 	const shortWord = Emitter.filter (v => v.length <= 3) (word)
// 	shortWord.subscribe(value => t.equal(value, expected.shift()))

// 	await word.emit('things')
// 	await word.emit('stuff')
// 	await word.emit('foo')
// 	await word.emit('whatever')
// 	await word.emit('bar')
// })

// test('Emitter.flatten makes an emitter that emits when emitters emited from the given emitter (inner emitters) emit', async t => {
// 	const expected = [ 'foo', 'bar', 'baz', 'qux', 'fooz', 'fooz' ]
// 	const actual = []

// 	const emitterEmitter = Emitter.create()
// 	const a = Emitter.create()
// 	const b = Emitter.create()

// 	const flattenedEmitter = Emitter.flatten(emitterEmitter)
// 	flattenedEmitter.subscribe(value => actual.push(value))

// 	await Promise.all([
// 		emitterEmitter.emit(a),
// 		a.emit('foo'),
// 		emitterEmitter.emit(b),
// 		a.emit('bar'),
// 		b.emit('baz'),
// 		a.emit('qux'),
// 		emitterEmitter.emit(a),
// 		a.emit('fooz')
// 	])

// 	t.deepEqual(actual, expected)
// })

// test('Emitter.chain maps and flattens', async t => {
// 	const expected = [ 'foo', 'bar', 'baz', 'qux', 'fooz', 'fooz' ]
// 	const actual = []

// 	const emitterNameEmitter = Emitter.create()
// 	const a = Emitter.create()
// 	const b = Emitter.create()
// 	const emitters = { a, b }

// 	const flattenedEmitter = Emitter.chain (name => emitters[name]) (emitterNameEmitter)
// 	flattenedEmitter.subscribe(value => actual.push(value))

// 	await Promise.all([
// 		emitterNameEmitter.emit('a'),
// 		a.emit('foo'),
// 		emitterNameEmitter.emit('b'),
// 		a.emit('bar'),
// 		b.emit('baz'),
// 		a.emit('qux'),
// 		emitterNameEmitter.emit('a'),
// 		a.emit('fooz')
// 	])

// 	t.deepEqual(actual, expected)
// })

// test('Emitter.scan accumulates', async t => {
// 	const expected = [
// 		[ 1 ],
// 		[ 1, 2 ],
// 		[ 1, 2, 3 ]
// 	]
// 	const actual = []

// 	const a = Emitter.create()
// 	const b = Emitter.scan (v => acc => acc.concat(v)) ([]) (a)

// 	b.subscribe(value => actual.push(value))

// 	await Promise.all([
// 		a.emit(1),
// 		a.emit(2),
// 		a.emit(3)
// 	])

// 	t.deepEqual(actual, expected)
// })

// test('Emitter.recentN', async t => {
// 	const expected = [
// 		[ 1 ],
// 		[ 1, 2 ],
// 		[ 1, 2, 3 ],
// 		[ 1, 2, 3, 4 ],
// 		[ 2, 3, 4, 5 ],
// 		[ 3, 4, 5, 6 ]
// 	]
// 	const actual = []

// 	const a = Emitter.create()
// 	const b = Emitter.recentN (4) (a)

// 	b.subscribe(value => actual.push(value))

// 	await Promise.all([ 1, 2, 3, 4, 5, 6 ].map(a.emit))

// 	t.deepEqual(actual, expected)
// })

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

// // test('Emitter.pairwise', t => {
// // 	const expected = [
// // 		[ 1, 2 ],
// // 		[ 2, 3 ],
// // 		[ 3, 4 ]
// // 	]
// // 	t.plan(expected.length)
// // 	const a = Emitter.create()
// // 	const b = Emitter.pairwise(a)

// // 	b.subscribe(value => t.deepEqual(value, expected.shift()))

// // 	;[ 1, 2, 3, 4 ].forEach(a.emit)
// // })
