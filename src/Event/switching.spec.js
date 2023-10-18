import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { immediately } from '../immediately.js'
import * as Event from './index.js'

const test = suite('Event.switching')

test('switches between two non-simultaneous producers', () => {
	const a = Event.create()
	const b = Event.create()
	const c = Event.create()
	const d = Event.switching (c)
	const values = []
	Event.calling (x => values.push(x)) (d)

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

test.only('completes when source event completes if focused event is already complete', () => {
	const a = Event.create()
	const a_x = Event.create()
	const b = Event.complete_when (a_x) (a)
	const c = Event.switching (b)
	const d = Event.create()

	const values = []
	const completion_update_values = []

	Event.calling (x => values.push(x)) (c)
	Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

	a.produce(d)
	d.produce(1)
	a.produce(Event.never)
	assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
	a_x.produce('x')
	assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
	a_x.produce('x')
	a.produce(d)
	d.produce('x')
	a_x.produce('x')

	assert.equal (values, [ 1 ])
	assert.equal (completion_update_values, [ true ])
})

test.only('completes when focused event completes if source event is already complete', () => {
	const a = Event.create()
	const a_x = Event.create()
	const b = Event.complete_when (a_x) (a)
	const c = Event.switching (b)
	const d = Event.create()
	const d_x = Event.create()

	const values = []
	const completion_update_values = []

	Event.calling (x => values.push(x)) (c)
	Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

	a.produce(d)
	d.produce(1)
	a_x.produce('x')
	assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
	a.produce(Event.never)
	d.produce(2)
	d_x.produce('x')
	d.produce(3)
	assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

	assert.equal (values, [ 1, 2 ])
	assert.equal (completion_update_values, [ true ])
})


test('`switching (map (() => x) (x))` is equivalent to `x`', () => {
	const values = []
	const x = Event.create()
	Event.calling
		(x => values.push(x))
		(Event.switching (Event.map (() => x) (x)))

	x.produce(0)
	x.produce(1)

	assert.equal (values, [ 0, 1 ])
})

test('map to switch, all simultaneous', () => {
	const values = []
	const a = Event.create()
	const [ b, destroy_b ] = Event.calling (() => a) (a)
	const [ c, destroy_c ] = Event.calling
		(() => Event.switching (b))
		(a)
	const d = Event.switching (c)
	const [ e, destroy_e ] = Event.calling
		(x => values.push(x))
		(d)

	a.produce(0)
	a.produce(10)

	assert.equal (values, [ 0, 10 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.create()
	const b = Event.map (x => x + 100) (a)
	const c = Event.map (() => Event.switching (Event.map (() => a) (b))) (b)
	const d = Event.switching (c)
	Event.calling
		(x => values.push(x))
		(d)

	a.produce(0)
	a.produce(10)

	assert.equal (values, [ 0, 10 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.create()
	const b = Event.map
		(() => Event.map (() => a) (a))
		(a)
	const c = Event.switching (b)
	const d = Event.switching (c)
	Event.calling
		(x => values.push(x))
		(d)
	a.produce(0)
	a.produce(1)
	assert.equal(values, [ 0, 1 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.create()
	const b = Event.map
		(() => Event.map (() => a) (a))
		(a)
	/*
		b occurs when a occurs.
		b's value is an event that occurs when `a` occurs, with a value of `a` itself.
		`a` is Event Number
		`b` is Event Event Event Number
		c switches when b occurs.
		c's `x` is the value of `b` (see above).
		The event that c switches to is a switch that:
			Its `x` is the value of `b`: Event Event Number
			switches when `x` occurs (when `a` occurs),
			its `y` is the value of `x`:
			Event Number
			which is `a`.
	*/
	const c = Event.switching
		(Event.map
			(Event.switching)
			(b)
		)
	Event.calling
		(x => values.push(x))
		(c)
	a.produce(0)
	a.produce(1)
	assert.equal(values, [ 0 , 1 ])
})

test('map in simultaneous switch', () => {
	const values = []
	const a = Event.create()
	const b = Event.switching
		(Event.map
			(() => Event.map (x => x + 10) (a))
			(a)
		)
	Event.calling
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
	const a = Event.create()
	const b = Event.switching
		(Event.map
			(() => Event.switching (Event.map(() => a) (a)))
			(a)
		)
	Event.calling
		(x => values.push(x))
		(b)
	a.produce(0)
	a.produce(1)
	a.produce(2)

	assert.equal(values, [ 0, 1, 2 ])
})

test('switch to switch in map in map, all simultaneous', () => {
	const values = []
	const a = Event.create()
	const b = Event.map (x => Event.map (y => x + y) (a)) (a)
	const c = Event.switching
		(Event.map
			(() => Event.switching (b))
			(a)
		)

	Event.calling
		(x => values.push(x))
		(c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal (values, [ 2, 4, 6 ])
})

test('switch to map to switch, all simultaneous', () => {
	const values = []
	const a = Event.create()
	const b = Event.map (() => Event.switching (Event.map (() => a) (a))) (a)
	const c = Event.switching (b)

	Event.calling
		(x => values.push(x))
		(c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal (values, [ 1, 2, 3 ])
})


test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.create()

	Event.calling
		(x => values.push(x))
		(Event.switching
			(Event.map
				(() =>
					Event.map
						(x => x + 100)
						(Event.switching (Event.map (() => a) (a)))
				)
				(Event.map (() => 'x') (a))
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
	const a = Event.create()
	const b = Event.create()
	const merge_2 = a => b =>
		Event.switch_updating
			(immediately)
			(a)
			(Event.map
				(_ => merge_2 (b) (a))
				(b)
			)
	const c = merge_2 (a) (b)
	Event.calling (x => values.push(x)) (c)

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
		Event.switch_updating
			(immediately)
			(a)
			(Event.map
				(() => {
					++switches
					if (switches === 10) {
						throw new Error(error_message)
					}
					return merge_2 (b) (a)
				})
				(b)
			)
	
	const a = Event.create()
	const b = Event.map (x => x + 100) (a)
	const c = merge_2 (a) (b)

	const values = []
	Event.calling (x => values.push(x)) (c)

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
		Event.switching
			(Event.map
				(v => f (v) ? x : Event.never)
				(x)
			)

	const values = []
	const a = Event.create()
	const b = Event.filter (x => x % 2 === 0) (a)
	Event.calling
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
		Event.switching
			(Event.map
				(v => f (v) ? x : Event.never)
				(x)
			)

	const values = []
	const a = Event.create()
	const a_x = Event.create()
	const b = Event.filter (_ => true) (complete_when (a_x) (a))
	Event.merge_2_with
		(a => b => [ a, b ])
		(a_x)
		(completion (b))
	a_x.produce(1)
	assert.equal(values, [ 1, 1 ])
})

test.run()
