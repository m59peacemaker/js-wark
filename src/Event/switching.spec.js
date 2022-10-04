import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Reference, immediately, subsequently } from '../index.js'
import { promise_wait } from '../test/util.js'

const test = suite('Event.switching')

/*
	TODO: test garbage collection if possible
*/

test('switches between two regular producer, non-simultaneous events', () => {
	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const c = Event.exposed_producer()
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

test('`switching (map (() => x) (x))` is equivalent to `x`', () => {
	const values = []
	const x = Event.exposed_producer()
	Event.calling
		(x => values.push(x))
		(Event.switching (Event.map (() => x) (x)))

	x.produce(0)
	x.produce(1)

	assert.equal (values, [ 0, 1 ])
})

test('map to switch, all simultaneous', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.map (() => Event.switching (Event.map (() => a) (a))) (a)
	const c = Event.switching (b)
	Event.calling
		(x => values.push(x))
		(c)

	a.produce(0)
	a.produce(10)

	assert.equal (values, [ 0, 10 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.exposed_producer()
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
	const a = Event.exposed_producer()
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
	assert.equal(values, [ 0 , 1 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.exposed_producer()
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
			/*
				With the current implementation,
				at the time this `switch` expression is evaluated, `x` is not settled and its value is nothing.
				`b` propagates to `c`
				a starts propagating
					b observes a, created its inner `map`
					b starts propagating
						c observes b, computes the switch, creating this inner switch
					b is done propagating
					the inner `map` of b starts propagating
						this inner switch observes that, and so computes the switch, the switched-to event is ocurring,
						so it starts propagating
							c observes that (via its inner event observer)
							c starts propagating
								the side effect is performed
							c is done propagating
						this inner switch is done propagating
					the inner `map` of b is done propagating
				a is done propagating
			*/
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
	const a = Event.exposed_producer()
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
	const a = Event.exposed_producer()
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
	const a = Event.exposed_producer()
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
	const a = Event.exposed_producer()
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
	const a = Event.exposed_producer()

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

test('completes when source event was initially complete and focused event completes', () => {
	const b_values = []
	const b_complete_values = []

	const a = Event.exposed_producer()
	const b = Event.switch_updating
		(() => { throw new Error ('should not be doing this') })
		(Event.take (2) (a))
		(Event.never)
	Event.calling (x => b_values.push(x)) (b)
	Event.calling (x => b_complete_values.push(x)) (Event.complete (b))

	a.produce (1)
	a.produce (2)

	assert.equal(b_values, [ 1, 2 ])
	assert.equal(b_complete_values, [ 2 ])

	a.produce (3)
	a.produce (4)

	assert.equal(b_values, [ 1, 2 ])
	assert.equal(b_complete_values, [ 2 ])
})

test('completes when source event has completed simultaneously as it occurred previously, focused event completes, and focused event is not occurring', () => {
	const c_values = []
	const c_complete_values = []

	const x = Event.exposed_producer()
	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const b_x = Event.exposed_producer()
	const c = Event.switch_updating
		(immediately)
		(Event.never)
		(Event.take_until (a) (a))

	Event.calling (x => c_values.push(x)) (c)
	Event.calling (x => c_complete_values.push(x)) (Event.complete (c))

	a.produce (Event.take_until (b_x) (b))

	assert.equal(c_values, [])
	assert.equal(c_complete_values, [])

	b.produce(1)
	b.produce(2)
	b_x.produce('x')

	assert.equal(c_values, [ 1, 2 ])
	assert.equal(c_complete_values, [ 'x' ])

	b.produce(3)
	b_x.produce('y')
	a.produce (x)
	x.produce('nope')
	a.produce(b)
	b.produce(1)

	assert.equal(c_values, [ 1, 2 ])
	assert.equal(c_complete_values, [ 'x' ])
})

test('completes when source event has completed previously, focused event completes, and focused event is occurring', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.switch_updating
		(subsequently) // NOTE: this doesn't matter for this test
		(Event.take_until (a) (a))
		(Event.never)

	Event.calling
		(x => values.push(x))
		(Event.merge_array
			([
				b,
				Event.complete (b)
			])
		)
	a.produce(1)
	assert.equal(values, [ [ 1, 1 ] ])
	a.produce(2)
	a.produce(3)
	assert.equal(values, [ [ 1, 1 ] ])
})

test('completes when source event completes and focused event completes (simultaneously), source event is not occurring, and focused event is not occurring', () => {
	const values = []
	const a = Event.exposed_producer()
	const a_complete = Event.exposed_producer()
	const b = Event.take_until (a_complete) (a)
	const c = Event.switch_updating
		(immediately) // NOTE: this doesn't matter for this test
		(b)
		(b)
	Event.calling
		(x => values.push(x))
		(Event.merge_array ([
			c,
			Event.complete(c)
		]))
	a_complete.produce('x')
	assert.equal(values, [ [ Event.nothing, 'x' ] ])
	a.produce(a)
	assert.equal(values, [ [ Event.nothing, 'x' ] ])
})

test('completes when source event completes and (next) focused event completes (simultaneously), source event is occurring and (next) focused event is not occurring', () => {
	const values = []
	const a = Event.exposed_producer()
	const a_once = Event.take_until (Event.map (() => 'x') (a)) (a)
	const b = Event.exposed_producer()
	const c = Event.switch_updating
		(immediately)
		(Event.never)
		(Event.map (Event.map (()  => 'a')) (a_once))

	Event.calling
		(x => values.push(x))
		(Event.merge_array
		([
				c,
				Event.complete(c)
			])
		)
	a.produce(Event.take_until (a) (b))
	assert.equal(values, [ [ Event.nothing, 'x' ] ])
	b.produce(0)
	a.produce(Event.take_until (a) (b))
	b.produce(0)
	assert.equal(values, [ [ Event.nothing, 'x' ] ])
})

test('completes when source event completes and focused event completes (simultaneously), source event is not occurring and focused event is occurring', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const c = Event.switch_updating
		(immediately)
		(Event.take_until (b) (b))
		(Event.take_until (b) (a))
	Event.calling
		(x => values.push(x))
		(Event.merge_array
			([
				c,
				Event.complete(c)
			])
		)
	b.produce('x')
	assert.equal(values, [ [ 'x', 'x' ] ])
	b.produce('y')
	a.produce(a)
	a.produce(a)
	assert.equal(values, [ [ 'x', 'x' ] ])
})

test('completes when source event completes and (next) focused event completes (simultaneously), source event is occurring and (next) focused event is occurring', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.take_until (Event.map (() => 'x') (a)) (a)
	const c = Event.switch_updating
		(immediately)
		(Event.never)
		(Event.map (Event.map (()  => 'a')) (b))
	Event.calling
		(x => values.push(x))
		(Event.merge_array
			([
				c,
				Event.complete(c)
			])
		)
	a.produce(b)
	assert.equal(values, [ [ 'a', 'x' ] ])
	a.produce(a)
	a.produce(b)
	assert.equal(values, [ [ 'a', 'x' ] ])
})

test('TODO: name this', async () => {
	const values = []
	let i = 0
	Event.calling
		(x => values.push(x))
		(Event.take
		(4)
			(Reference.forward_referencing (x =>
				Event.switch_updating
					(subsequently)
					(Event.wait ({ ms: 50, value: i }))
					(Event.calling (() => Event.wait ({ ms: 50, value: ++i })) (x))
			))
		)
	await promise_wait(500)
	assert.equal(values, [ 0, 1, 2, 3 ])
})

/*
	a is unsettling:
		a unsettles x (switch, unsettled by inner event)
		x is unsettling from a (inner_event):
			x (switch) unsettles y
			x (switch) unsettles z
			z unsettles x (switch, unsettled by source event)
			x (switch) unsettles y
			Error_Cycle_Detected
*/

	// TODO: test/explain deferred version
test('throws Error_Cycle_Detected when own occurrence causes a switch to an event that is occurring simultaneously', () => {
	const a = Event.exposed_producer()
	const x = Reference.create()
	const y = Event.map (x => x * 2) (x)
	const z = Event.map (() => y) (x)
	x.assign(
		Event.switch_updating
			(immediately)
			(a)
			(z)
	)
	Event.calling (console.log) (x)
	assert.throws(() => a.produce(10), error => error instanceof Event.Error_Cycle_Detected)
})

/*
	a.produce (1)

	a unsettles b

	Either of these coming first seems a possibility:
		a unsettles c (switch, unsettled by inner event (a))
		b unsettles c (switch, unsettled by source event (b))
	but both may happen in the same propagation!
	
	c (switch) needs to occur with new inner event value (merge_2 (b) (a)), which is `switch_updating (immediately) (b) (map (etc) (b))`

	Either:
		c (switch, inner observer) computes, then c (switch, source observer) computes
		or:
		c (switch, inner observer) computes, then c (switch, source observer) computes
	
	TODO:!!
		If inner observer compute is called first, but the switch should also happen now, the inner observer compute should either do nothing, or go ahead and compute the switch and settle.
		This may need a new state, which can be determined from pre-compute: switch_pending = is_same_event_reference(source_event, dependency)
		if (switch_pending) {
			compute_switch()
			switch_pending = false
			// etc
			maybe_settle()
		}
	TODO: also, would the rule be: if an event is pre_computing because of a, and it is pre-computed within that, it must be by b?
	if (pre_computing_from_dependency === dependency) {
		throw new Error_Cycle_Detected()
	}
	pre_computing_from_dependency = dependency
	An issue would be if `a` caused the pre_compute, then `b`, then `a` again.
	So maybe:
	was_precomputing_from_a = pre_computing_from_a
	was_precomputing_from_b = pre_computing_from_b
	pre_computing_from_a = is_same_event_reference (a, dependency)
	pre_computing_from_b = is_same_event_reference (b, dependency)
	if (was_precomputing_from_a && pre_computing_from_a) {

	}
	if (was_precomputing_from_b && pre_computing_from_b) {

	}

	applying this to switch:
		pre_computing_from_source_event
		pre_computing_from_inner_event


		switch_updating
			(immediately)
			(a)
			(map (() => merge_2 (b) (a)) (b))

		`a`, the initial inner event, is occurring with a value of `1`,
		but `b`, is occurring with a value of `101`,
		so the switch is occurring, which switches to `merge_2 (b) (a)`.
		so the `switch` should occur with the value of `merge_2 (b) (a)`, if it is occurring.

		merge_2 (b) (a) is:
			switch_updating
				(immediately)
				(b)
				(map (() => merge_2 (a) (b)) (a))

		`b`, the initial inner event, is occurring with a value of `101`,
		but `a` is occurring with a value of `1`,
		so the switch is occurring, which switches to `merge_2 (a) (b)`,
		so the `switch` should occur with the value of `merge_2 (a) (b)`, if it is occurring.

		merge_2 (a) (b) is:
			switch_updating
				(immediately)
				(a)
				(map (() => merge_2 (b) (a)) (b))

		That is the original expression, so this is an infinite loop.

		Now the question is how to detect and (whether to) handle this...
*/

// See TODO  in focused_event_observer pre_compute
test.skip('merge_2 built from switch, merges non-simultaneous input events', () => {
	const merge_2 = a => b =>
		Event.switch_updating
			(immediately)
			(() => merge_2 (b) (a))
			(a)
			(b)
	
		// switching
		// 	(immediately)
		// 	(a)
		// 	(map
		// 		(() => {
		// 			++switches
		// 			if (switches === 10) {
		// 				throw new Error(error_message)
		// 			}
		// 			return merge_2 (b) (a)
		// 		})
		// 		(b)
		// 	)

	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const c = merge_2 (a) (b)

	const values = []
	Event.calling (x => values.push(x)) (c)

	a.produce(1)
	a.produce(2)
	b.produce(3)
	b.produce(4)
	a.produce(5)

	assert.equal(values, [ 1, 2, 3, 4, 5 ])
})

// NOTE: this is fun
test('recursive map switch can implement merge_2 for non simultaneous events', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const merge_2 = a => b =>
		Event.switch_updating
			(immediately)
			(a)
			(Event.map
				(() => merge_2 (b) (a))
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
			(Event.calling
				(() => {
					++switches
					if (switches === 10) {
						throw new Error(error_message)
					}
					return merge_2 (b) (a)
				})
				(b)
			)
	
		// switch_updating
		// 	(immediately)
		// 	(a)
		// 	(map
		// 		(() => {
		// 			++switches
		// 			if (switches === 10) {
		// 				throw new Error(error_message)
		// 			}
		// 			return merge_2 (b) (a)
		// 		})
		// 		(b)
		// 	)

	const a = Event.exposed_producer()
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

test.run()
