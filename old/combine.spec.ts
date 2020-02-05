import test from 'zora'
import { Stream, combine, isStream } from './'

const doubleFn = ([ x ]) => x.get() * 2

test('combine', t => {
	t.test('computeFn is passed an array of dependencies', t => {
		let a$
		let b$
		combine
			(([ a, b ]) => {
				a$ = a
				b$ = b
			})
			([ Stream(4), Stream(3) ])
		t.equal(a$.get(), 4)
		t.equal(b$.get(), 3)
	})

	t.test('basic combine', t => {
		const a = Stream ()
		const b = combine
			(([ x ]) => x.get() + 1)
			([ a ])

		t.equal(b.get(), undefined)

		a.set(1)

		t.equal(b.get(), 2)
	})

	t.test('computeFn is called immediately if dependencies are initialized', t => {
		let result = 0
		combine (() => ++result) ([ Stream(0) ])
		t.equal(result, 1)
	})

	t.test('computeFn is not called immediately if dependencies are not initialized', t => {
		let result = 0
		combine (() => ++result) ([ Stream(0), Stream() ])
		t.equal(result, 0)
	})

	t.test('stream is initially computed when dependencies are initialized', t => {
		const a = Stream(1)
		const b = Stream(2)
		const c = combine
			(([ a, b ]) => a.get() + b.get())
			([ a, b ])

		t.ok(a.initialized)
		t.ok(b.initialized)
		t.ok(c.initialized)
		t.equal(c.get(), 3)
	})

	t.test('stream is not initially computed if any dependencies are not initialized', t => {
		const a = Stream(1)
		const b = Stream()
		const c = combine
			(([ a, b ]) => a.get() + b.get())
			([ a, b ])

		t.ok(a.initialized)
		t.notOk(b.initialized)
		t.notOk(c.initialized)
		t.equal(c.get(), undefined)
	})

	t.test('stream recomputes when dependency changes', t => {
		const a = Stream(1)
		const b = Stream(2)
		const c = combine
			(([ a, b ]) => a.get() + b.get())
			([ a, b ])

		t.equal(c.get(), 3)

		a.set(20)

		t.equal(c.get(), 22)
	})

	t.test('one source change leads to one graph - updates are atomic', t => {

		let dUpdateCount = 0

		const a = Stream(1)
		const b = combine
			(([ a ]) => a.get() + 1)
			([ a ])
		const c = combine
			(([ a ]) => a.get() + 10)
			([ a ])
		const d = combine
			(([ b, c ]) => {
				++dUpdateCount
				return b.get() + c.get()
			})
			([ b, c ])

		t.equal(a.get(), 1)
		t.equal(b.get(), 2)
		t.equal(c.get(), 11)
		t.equal(d.get(), 13)
		t.equal(dUpdateCount, 1)

		a.set(2)
		t.equal(b.get(), 3)
		t.equal(c.get(), 12)
		t.equal(d.get(), 15)
		t.equal(dUpdateCount, 2, 'a updated, so b and c updated, and d that depends on b and c updated only once')
	})

	t.test('creating and combining streams inside of a stream body', t => {
		const n = Stream (1)
		const nPlus = combine
			(([ n ]) => n.get() + 100)
			([ n ])
		t.equal(nPlus.get(), 101)

		combine
			(() => {
				const n = Stream(1)
				const nPlus = combine
					(([ n ]) => n.get() + 100)
					([ n ])
				t.equal(nPlus.get(), 101)
			})
			([ Stream (1) ])
	})

	t.test('setting another stream within computeFn', t => {
		const x = Stream(4)
		const y = Stream(3)
		const z = Stream(1)
		const doubleX = combine (doubleFn) ([x])
		const setAndSum = combine
			(([ y, z ]) => {
				x.set(3)
				return z.get() + y.get()
			})
			([y, z])

		z.set(4)

		t.equal(setAndSum.get(), 7)
		t.equal(doubleX.get(), 6)
	})

	t.test('setting dependency within computeFn', t => {
		let bCount = 0
		let cCount = 0

		const a = Stream()
		const b = combine
			(([ a ]) => {
				++bCount
				if (a.get() === 10) {
					a.set(11)
				}
				return a.get() + 2
			})
			([ a ])

		const c = combine (() => {
			++cCount
		}) ([ b ])

		t.equal(bCount, 0)
		t.equal(cCount, 0)

		a.set(10)

		t.equal(b.get(), 13)
		t.equal(bCount, 2, '"b" called twice')
		t.equal(cCount, 2, '"c" called twice')
	})

	// flyd says this should be [ 1, 2 ], but I don't see that as a good thing
	// commented out lines show the comparison to flyd
	// t.test('executes to the end before handlers are triggered', t => {
	t.test('execution order when setting another stream in a computeFn', t => {
		const order = []
		const x = Stream(4)
		const y = Stream(3)
		const z = combine
			(([ x ]) => { // executes now
				if (x.get() === 3) {
					order.push(2) // executes when x.set(3) in the next combine
				}
				return x.get() * 2
			})
			([ x ])

		t.equal(z.get(), 8)

		combine
			(([ y ]) => { // executes now
				x.set(3) // triggers combine function above, flyd says it should wait
				order.push(1)
			})
			([ y ])

		// t.deepEqual(order, [ 1, 2 ])
		t.deepEqual(order, [ 2, 1 ])
	})

	// TODO:
	return
	t.test('combining end streams', t => {
		const a = Stream()
		const b = Stream()
		const c = combine
			(([ aEnd, bEnd ]) => 123)
			([ a.end, b.end ])

		endsOn ([ c ]) (c)

		t.equal(c.get(), undefined)
		t.false(c.end.get())

		a.end()

		t.equal(c.get(), undefined)
		t.false(c.end.get())

		b.end()

		t.equal(c.get(), 123)
		t.true(c.end.get())
	})
})
