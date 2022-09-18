import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'
import { promise_wait } from '../test/util.js'
import { nothing } from './nothing.js'

const test = suite('Event.merge_2_with')

test('merged event has all occurrences of input events', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const c = Event.merge_2_with (a => b => [ a, b ]) (a) (b)
	Event.calling (x => values.push(x)) (c)
	a.produce(1)
	b.produce(2)
	b.produce(3)
	a.produce(4)
	b.produce(5)
	assert.equal(values, [ [ 1, nothing ], [ nothing, 2 ], [ nothing, 3 ], [ 4, nothing ], [ nothing, 5 ] ])
})

test('completes when all input events are complete', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const ax = Event.exposed_producer()
	const bx = Event.exposed_producer()
	const aax = Event.take_until (ax) (a)
	const bbx = Event.take_until (bx) (b)
	const c = Event.merge_2_with (a => b => ([ a, b ])) (aax) (bbx)
	const cx = Event.complete(c)
	Event.calling (x => values.push(x)) (cx)
	a.produce(1)
	b.produce(2)
	b.produce(3)
	ax.produce('ax')
	bx.produce('bx')
	a.produce(4)
	b.produce(5)
	assert.equal(values, [ 'bx' ])
})

test('merging an event with itself creates an event with two simultaneous occurrences', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.merge_2_with (a => b => [ a, b ]) (a) (a)
	Event.calling (x => values.push(x)) (b)
	a.produce(1)
	a.produce(2)
	assert.equal(values, [ [ 1, 1 ], [ 2, 2 ] ])
})

test('merging an event with itself creates an event that completes once, when the input events complete', () => {
	const values = []
	const a = Event.exposed_producer()
	const a2 = Event.take (2) (a)
	const b = Event.merge_2_with (a => b => [ a, b ]) (a2) (a2)
	const c = Event.merge_2_with (b => b_complete => [ ...b, { complete: b_complete } ]) (b) (Event.complete (b))
	Event.calling (x => values.push(x)) (c)
	a.produce(1)
	a.produce(2)
	assert.equal(values, [ [ 1, 1, { complete: nothing } ], [ 2, 2, { complete: 2 } ] ])
})

test('merge throws Error_Cycle_Detected when its dependency a occurs and its dependency b has a dependency on the merge', () => {
	/*
		a unsettles b (merge, unsettled by a)
		b unsettles b (merge, unsettled by b - cycle not allowed) -> Error_Cycle_Detected

		a is propagating:
			a propagates to b
			b is propagating:
				b propagates to b -> Error_Cycle_Detected

		but there's no switch here, so this should be detectable in pre_compute, which would catch something like `filter` even when it won't be occurring now

		${dependency}_is_circular should be renamed to something more clear.

		if merge has a cyclically unsettled depedendency through a switch source event, that switch must not occur in that moment,
		and this can be verified when the switch settles and propagates to its dependants,
		which include the merge,
		at which point the merge can check: if dependency is cyclical and has not occurred.

		the boolean set by switch when pre_computing/unsettling dependants refers to the idea that the dependency graph of those dependants is undetermined/unsetted/pending determination
		and so when it loops around back to a merge, the merge allows it to continue so that the dependency graph can be determined.
		Prior to that, it isn't possible to throw an error about cyclical dependencies, because they are thus far unknown/undetermined.

		focused/unfocused 

		while switch is pre_computing/unsettling, if it is again pre_computed, through the source event observer,
		it should set a boolean that its occurrence affects the dependency graph of its dependants / causes switch (my occurrence causes my switch)
		and stop the pre_compute loop there

		then when its inner event causes it to compute, its source event is unsettled, but it will settle and compute its occurrence and occur now,
		due to the boolean (my occurrence causes my switch)
		then it propagates to its dependants
		and due to the dependency cycle, its source event observer will be computed,
		so the switch happens / the new event is focused
		if the new focused event is occurring, throw an Error, because it would imply a loop of occurring/switching/occurring/etc
	*/
	const b = Event.forward_reference()
	const a = Event.exposed_producer()
	b.assign (
		Event.merge_2_with
			(a => _ => a)
			(a)
			(b)
	)

	Event.calling (console.log) (b)

	assert.throws(
		() => a.produce(1),
		error => error instanceof Event.Error_Cycle_Detected
	)
})

test('merge throws Error_Cycle_Detected when its dependency b occurs and its dependency a has a dependency on the merge', () => {
	const a = Event.forward_reference()
	const b = Event.exposed_producer()
	a.assign (
		Event.merge_2_with
			(a => _ => a)
			(a)
			(b)
	)

	Event.calling (console.log) (a)

	assert.throws(
		() => b.produce(1),
		error => error instanceof Event.Error_Cycle_Detected
	)
})

test.run()
