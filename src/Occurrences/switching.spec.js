import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { immediately } from '../immediately.js'
import * as Occurrences from './index.js'

const test = suite('Occurrences.switching')

test('switches between two non-simultaneous producers', () => {
	const a = Occurrences.create()
	const b = Occurrences.create()
	const c = Occurrences.create()
	const d = Occurrences.switching (c)
	const values = []
	Occurrences.calling (x => values.push(x)) (d)

	c.produce(a)
	a.produce(1)
	a.produce(2)
	c.produce(b)
	a.produce('x')
	b.produce(3)
	b.produce(4)
	c.produce(a)
	b.produce('x')
	a.produce(5)

	assert.equal (values, [ 1, 2, 3, 4, 5 ])
})

test('`switching (map (() => x) (x))` is equivalent to `x`', () => {
	const values = []
	const x = Occurrences.create()
	Occurrences.calling
		(x => values.push(x))
		(Occurrences.switching (Occurrences.map (() => x) (x)))

	x.produce(0)
	x.produce(1)

	assert.equal (values, [ 0, 1 ])
})

test('map to switch, all simultaneous', () => {
	const values = []
	const a = Occurrences.create()
	const [ b, destroy_b ] = Occurrences.calling (() => a) (a)
	const [ c, destroy_c ] = Occurrences.calling
		(() => Occurrences.switching (b))
		(a)
	const d = Occurrences.switching (c)
	const [ e, destroy_e ] = Occurrences.calling
		(x => values.push(x))
		(d)

	a.produce(0)
	a.produce(10)

	assert.equal (values, [ 0, 10 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.map (x => x + 100) (a)
	const c = Occurrences.map (() => Occurrences.switching (Occurrences.map (() => a) (b))) (b)
	const d = Occurrences.switching (c)
	Occurrences.calling
		(x => values.push(x))
		(d)

	a.produce(0)
	a.produce(10)

	assert.equal (values, [ 0, 10 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.map
		(() => Occurrences.map (() => a) (a))
		(a)
	const c = Occurrences.switching (b)
	const d = Occurrences.switching (c)
	Occurrences.calling
		(x => values.push(x))
		(d)
	a.produce(0)
	a.produce(1)
	assert.equal(values, [ 0, 1 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.map
		(() => Occurrences.map (() => a) (a))
		(a)
	/*
		b occurs when a occurs.
		b's value is an event that occurs when `a` occurs, with a value of `a` itself.
		`a` is Occurrences Number
		`b` is Occurrences Occurrences Occurrences Number
		c switches when b occurs.
		c's `x` is the value of `b` (see above).
		The event that c switches to is a switch that:
			Its `x` is the value of `b`: Occurrences Occurrences Number
			switches when `x` occurs (when `a` occurs),
			its `y` is the value of `x`:
			Occurrences Number
			which is `a`.
	*/
	const c = Occurrences.switching
		(Occurrences.map
			(Occurrences.switching)
			(b)
		)
	Occurrences.calling
		(x => values.push(x))
		(c)
	a.produce(0)
	a.produce(1)
	assert.equal(values, [ 0 , 1 ])
})

test('map in simultaneous switch', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.switching
		(Occurrences.map
			(() => Occurrences.map (x => x + 10) (a))
			(a)
		)
	Occurrences.calling
		(x => values.push(x))
		(b)
	a.produce(0)
	a.produce(1)
	a.produce(2)

	assert.equal(values, [ 10, 11, 12 ])
})

/*
*/
test('switch to simultaneous in simultaneous switch', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.switching
		(Occurrences.map
			(() => Occurrences.switching (Occurrences.map(() => a) (a)))
			(a)
		)
	Occurrences.calling
		(x => values.push(x))
		(b)
	a.produce(0)
	a.produce(1)
	a.produce(2)

	assert.equal(values, [ 0, 1, 2 ])
})

test('switch to switch in map in map, all simultaneous', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.map (x => Occurrences.map (y => x + y) (a)) (a)
	const c = Occurrences.switching
		(Occurrences.map
			(() => Occurrences.switching (b))
			(a)
		)

	Occurrences.calling
		(x => values.push(x))
		(c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal (values, [ 2, 4, 6 ])
})

test('switch to map to switch, all simultaneous', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.map (() => Occurrences.switching (Occurrences.map (() => a) (a))) (a)
	const c = Occurrences.switching (b)

	Occurrences.calling
		(x => values.push(x))
		(c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal (values, [ 1, 2, 3 ])
})


test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Occurrences.create()

	Occurrences.calling
		(x => values.push(x))
		(Occurrences.switching
			(Occurrences.map
				(() =>
					Occurrences.map
						(x => x + 100)
						(Occurrences.switching (Occurrences.map (() => a) (a)))
				)
				(Occurrences.map (() => 'x') (a))
			)
		)

	a.produce(0)
	a.produce(10)
	a.produce(20)

	assert.equal (values, [ 100, 110, 120 ])
})

// NOTE: this is fun
test('recursive map switch can implement merge_2 for non simultaneous events', () => {
	const values = []
	const a = Occurrences.create()
	const b = Occurrences.create()
	const merge_2 = a => b =>
		Occurrences.switch_updating
			(immediately)
			(a)
			(Occurrences.map
				(_ => merge_2 (b) (a))
				(b)
			)
	const c = merge_2 (a) (b)
	Occurrences.calling (x => values.push(x)) (c)

	a.produce(1)
	b.produce(2)
	a.produce(3)
	a.produce(4)
	b.produce(5)
	a.produce(6)

	assert.equal(values, [ 1, 2, 3, 4, 5, 6 ])
})

// TODO: this is actually just testing a recursive `map`, so it can be removed, but this loop was once incorrectly prevented with unexpected behavior and so it could be good to have a test like this somehwere
test('merge_2 built from switch is an infinite loop when the input events are simultaneous', () => {
	const error_message = 'infinite loop'
	let switches = 0

	const merge_2 = a => b =>
		Occurrences.switch_updating
			(immediately)
			(a)
			(Occurrences.map
				(() => {
					++switches
					if (switches === 10) {
						throw new Error(error_message)
					}
					return merge_2 (b) (a)
				})
				(b)
			)
	
	const a = Occurrences.create()
	const b = Occurrences.map (x => x + 100) (a)
	const c = merge_2 (a) (b)

	const values = []
	Occurrences.calling (x => values.push(x)) (c)

	assert.throws (() => a.produce (1), error => error.message === error_message)
})

/*
test.skip('', () => {
	const skip_until = y => x
		switch_resolve
			(immediately)
			(never)
			(map
				(() => x)
				(y)
			)

	// TODO: something like this may work, but there may be no need for it.
	// `instant_after` could be implemented using a `post_propagation` style list of functions to "run" a moment of time after another.
	// The idea is applicable to Action as well, which could pass around a propagation object with a list for that purpose.
	const merge_2 = a => b =>
		switch_resolve
			(focused => focusing => focused)
			(a)
			(map
				(() =>
					merge_2
						(b)
						(skip_until (instant_after (b)) (a))
				)
				(b)
			)
})
*/

test('can implement filter (occurrences)', () => {
	const filter = f => x =>
		Occurrences.switching
			(Occurrences.map
				(v => f (v) ? x : Occurrences.never)
				(x)
			)

	const values = []
	const a = Occurrences.create()
	const b = Occurrences.filter (x => x % 2 === 0) (a)
	Occurrences.calling
		(x => values.push(x))
		(b)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	a.produce(4)
	assert.equal(values, [ 2, 4 ])
})

test.skip('can implement filter (completion)', () => {
	const filter = f => x =>
		Occurrences.switching
			(Occurrences.map
				(v => f (v) ? x : Occurrences.never)
				(x)
			)

	const values = []
	const a = Occurrences.create()
	const a_x = Occurrences.create()
	const b = Occurrences.filter (_ => true) (complete_when (a_x) (a))
	Occurrences.merge_2_with
		(a => b => [ a, b ])
		(a_x)
		(completion (b))
	a_x.produce(1)
	assert.equal(values, [ 1, 1 ])
})

test.run()
