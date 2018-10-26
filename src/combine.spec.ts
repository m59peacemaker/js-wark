import test from 'zora'
import { Stream, combine, isStream } from './'

const doubleFn = (self, [ x ]) => self.set(x.get() * 2)

test('combine', t => {
	t.test('combineFn is passed a new stream', t => {
		let stream
		combine (self => stream = self) ([ ])
		t.ok(isStream(stream))
	})

	t.test('combineFn is passed an array of dependencies', t => {
		let a$
		let b$
		combine
			((self, [ a, b ]) => {
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
			((self, [ x ]) => self.set(x.get() + 1))
			([ a ])

		t.equal(b.get(), undefined)

		a.set(1)

		t.equal(b.get(), 2)
	})

	t.test('combineFn is called immediately if dependencies are initialized', t => {
		let result = 0
		combine (() => ++result) ([ Stream(0) ])
		t.equal(result, 1)
	})

	t.test('combineFn is not called immediately if dependencies are not initialized', t => {
		let result = 0
		combine (() => ++result) ([ Stream(0), Stream() ])
		t.equal(result, 0)
	})

	t.test('stream is initially computed when dependencies are initialized', t => {
		const a = Stream(1)
		const b = Stream(2)
		const c = combine
			((self, [ a, b ]) => {
				self.set(a.get() + b.get())
			})
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
			((self, [ a, b ]) => {
				self.set(a.get() + b.get())
			})
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
			((self, [ a, b ]) => {
				self.set(a.get() + b.get())
			})
			([ a, b ])

		t.equal(c.get(), 3)

		a.set(20)

		t.equal(c.get(), 22)
	})

	t.test('one source change leads to one graph - updates are atomic', t => {

		let dUpdateCount = 0

		const a = Stream(1)
		const b = combine
			((self, [ a ]) => self.set(a.get() + 1))
			([ a ])
		const c = combine
			((self, [ a ]) => self.set(a.get() + 10))
			([ a ])
		const d = combine
			((self, [ b, c ]) => {
				++dUpdateCount
				self.set(b.get() + c.get())
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
			((self, [ n ]) => self.set(n.get() + 100))
			([ n ])
		t.equal(nPlus.get(), 101)

		combine
			(() => {
				const n = Stream(1)
				const nPlus = combine
					((self, [ n ]) => self.set(n.get() + 100))
					([ n ])
				t.equal(nPlus.get(), 101)
			})
			([ Stream (1) ])
	})

	t.test('setting another stream within combineFn', t => {
		const x = Stream(4)
		const y = Stream(3)
		const z = Stream(1)
		const doubleX = combine (doubleFn) ([x])
		const setAndSum = combine
			((self, [ y, z ]) => {
				x.set(3)
				self.set(z.get() + y.get())
			})
			([y, z])

		z.set(4)

		t.equal(setAndSum.get(), 7)
		t.equal(doubleX.get(), 6)
	})

	t.test('multiple self.sets within combineFn', t => {
		const a = Stream()

		const b = combine
			((self, [ a ]) => {
				self.set(a.get())
				self.set(a.get() + 1)
			})
			([ a ])

		let count = 0
		const c = combine
			((self, [ b ]) => {
				++count
				self.set(b.get())
			})
			([ b ])

		a.set(1)

		t.equal(b.get(), 2)
		t.equal(c.get(), 2)
		t.equal(count, 2)

		a.set(10)

		t.equal(b.get(), 11)
		t.equal(c.get(), 11)
		t.equal(count, 4)
	})

	t.test('setting dependency within combineFn', t => {
		let bCount = 0
		let cCount = 0

		const a = Stream()
		a.label = 'a'
		const b = combine
			((self, [ a ]) => {
				++bCount
				if (a.get() === 10) {
					a.set(11)
				}
				console.log('setting b')
				self.set(a.get() + 2)
			})
			([ a ])

		const c = combine (() => {
			console.log('c: b.get()', b.get())
			++cCount
		}) ([ b ])

		b.label = 'b'
		c.label = 'c'

		t.equal(bCount, 0)
		t.equal(cCount, 0)

		a.set(10)

		t.equal(b.get(), 13)
		t.equal(bCount, 2, '"b" called twice')
		t.equal(cCount, 2, '"c" called twice')
	})

	return
	t.test('setting dependant stream directly', t => {
		const a = Stream()
		const b = combine
			(([ a ], self) => {
				self.set(a.get() + 1)
			})
			([ a ])
		const c = combine (([ b ], self) => self.set(b.get() + 10)) ([ b ])

		b.set(1)
		b.set(2)
		b.set(3)

		t.equal(b.get(), 3)
		t.equal(c.get(), 13)

		a.set(0)

		t.equal(b.get(), 1)
		t.equal(c.get(), 11)

		b.set(10)

		t.equal(b.get(), 10)
		t.equal(c.get(), 20)
	})

	t.test('combining end streams', t => {
		// TODO:
		const a = Stream()
		const b = Stream()
		const c = combine
			(([ aEnd, bEnd ], self) => self.set(123))
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

	// TODO: flyd says this should be [ 1, 2 ], but I don't see that as a good thing
	// t.test('executes to the end before handlers are triggered', t => {
	t.test('execution order when setting another stream in a combineFn', t => {
		const order = []
		const x = Stream(4)
		const y = Stream(3)
		const z = combine
			(([ x ], self) => { // executes now
				if (x.get() === 3) {
					order.push(2) // executes when x.set(3) in the next combine
				}
				self.set(x.get() * 2)
			})
			([ x ])

		t.equal(z.get(), 8)

		combine
			(([ y ], self) => { // executes now
				x.set(3) // triggers combine function above, flyd says it should wait
				order.push(1)
			})
			([ y ])

		// t.deepEqual(order, [ 1, 2 ])
		t.deepEqual(order, [ 2, 1 ])
	})
})
