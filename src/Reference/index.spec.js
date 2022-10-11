import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event, Reference } from '../index.js'

const test = suite('Reference')

test('`reference.assign(x)` returns `x` for convenience', () => {
	const a = Reference.create()
	assert.equal(a.assign('x'), 'x')
})

test('use', () => {
	let result
	const a = Reference.create()
	const b = Reference.use (x => x + 6) (a)
	Reference.call (x => result = x) (b)
	a.assign(4)
	assert.equal(result, 10)
})

test('use2', () => {
	let result
	const a = Reference.of (6)
	const b = Reference.create()
	const c = Reference.use2 (a => b => a + b) (a) (b)
	Reference.call (x => result = x) (c)
	b.assign(4)
	assert.equal(result, 10)
})

test('use3', () => {
	let result
	const a = Reference.of (6)
	const b = Reference.create()
	const c = Reference.create()
	const d = Reference.use3 (a => b => c => a + b + b) (a) (b) (c)
	Reference.call (x => result = x) (d)
	c.assign(b)
	b.assign(4)
	assert.equal(result, 14)
})

test('use flattens references', () => {
	let result
	const a = Reference.create()
	const b = Reference.use
		(a => Reference.of(a))
		(a)
	Reference.call (x => result = x) (b)
	a.assign(0)
	assert.equal(result, 0)
})

test('array', () => {
	let result
	const a = Reference.create()
	const b = Reference.create()
	const c = Reference.use2 (a => b => a + b) (a) (b)
	const d = Reference.array ([ a, c, b ])
	Reference.call (x => result = x) (d)
	a.assign(4)
	b.assign(6)
	assert.equal(result, [ 4, 10, 6 ])
})

test('object', () => {
	let result

	Reference.call
		(x => result = x)
		(Reference.object ({ foo: 1, bar: 2 }))
	assert.equal(result, { foo: 1, bar: 2 })

	Reference.call
		(x => result = x)
		(Reference.object (Reference.of({ foo: 1, bar: 2 })))
	assert.equal(result, { foo: 1, bar: 2 })

	Reference.call
		(x => result = x)
		(Reference.object (Reference.of({ foo: Reference.of(1), bar: 2 })))
	assert.equal(result, { foo: 1, bar: 2 })
})

test('complex', () => {
	let result
	const a = Reference.create()
	const b = Reference.create()
	const c = Reference.use
		(a => ({
			foo: a,
			bar: Reference.create()
		}))
		(a)
	const d = Reference.use
		(c => ({
			foo: c.foo,
			bar: Reference.use2 (x => y => x + y) (b) (c.bar)
		}))
		(c)

	Reference.call
		(c => c.bar.assign(4))
		(c)
	a.assign (0)
	b.assign (6)

	Reference.call (x => result = x) (Reference.object(d))
	assert.equal(result, { foo: 0, bar: 10 })
})

test('Dynamic.calling on dynamic with forward reference updates', () => {
	const values = []

	/*
		Logic depending on `a` is queued.
		Practically speaking, execution is paused for dependants of `a`.
	*/
	const a = Reference.create()
	const b = Event.hold (0) (a)
	Dynamic.calling (x => values.push(x)) (b)

	const z = Event.exposed_producer()

	// Execution is paused - the side effect was not called.
	assert.equal(values, [])

	// Resume execution of dependants of `a`.
	a.assign(z)

	// Execution resumed - the side effect was called.
	assert.equal(values, [ 0 ])

	z.produce(1)

	assert.equal(values, [ 0, 1 ])
})

// TODO: make some or all of this into tests
// const a = create()

// const create_b = chain(x =>
// 	console.log({ chian_x: x, bar: x.bar }) ||
// 	map (bar => console.log({ bar }) || ({ foo: bar, bar: of(0) })) (x.bar)
// )

// const b = create_b (a)

// call (console.log) (b)
// a.assign (b)

// const _foo = x => {
// 	const ref = create()
// 	x.get(ref, x => {
// 		x.bar.get(ref, console.log)
// 		ref.assign({
// 			foo: x.bar,
// 			bar: 10 //of(10)
// 		})
// 	})
// 	return ref
// }

// const foo = use (x => use (console.log) (x.bar) && ({ foo: x.bar, bar: 0 }))

// const a = create()
// const b = foo (a)

// a.assign(b)
// use (b => use (console.log) (b.foo)) (b)
// b.get(create(), b => b.foo.get(create(), console.log))

// const c = create()
// b.get(c, b => {
// 	const bar = create()
// 	b.bar.get(c, console.log)
// 	b.bar.get(c, x => bar.assign(x + 10))
// 	c.assign({
// 		foo: b.foo,
// 		bar
// 	})
// })

// const c = use
// 	(b => console.log ({ b }) || ({
// 		foo: b.foo,
// 		bar: b.bar + 10 //use (x => x + 10) (b.bar)
// 	}))
// 	(b)

// a.assign(c)
// // c.get(reference(), c => c.foo.get(reference(), console.log))
// use (c => use (console.log) (c.foo)) (c)

test.run()