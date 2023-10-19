import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { nothing } from './nothing.js'
import * as Event from './index.js'

const test = suite('Event.merge_2_with')

test('merged event has all occurrences of input events', () => {
	const values = []
	const a = Event.create()
	const b = Event.create()
	const c = Event.merge_2_with (a => b => [ a, b ]) (a) (b)
	Event.calling (x => values.push(x)) (c)
	a.produce(1)
	b.produce(2)
	b.produce(3)
	a.produce(4)
	b.produce(5)
	assert.equal(values, [ [ 1, nothing ], [ nothing, 2 ], [ nothing, 3 ], [ 4, nothing ], [ nothing, 5 ] ])
})

test('merging an event with itself creates an event with two simultaneous occurrences', () => {
	const values = []
	const a = Event.create()
	const b = Event.merge_2_with (a => b => [ a, b ]) (a) (a)
	Event.calling (x => values.push(x)) (b)
	a.produce(1)
	a.produce(2)
	assert.equal(values, [ [ 1, 1 ], [ 2, 2 ] ])
})

test('does not occur when return value is `nothing`', () => {
	const values = []
	const a = Event.create()
	const b = Event.create()
	const c = Event.merge_2_with (a => b => a === 0 || b === 0 ? nothing : (a === nothing ? b : a)) (a) (b)
	Event.calling (x => values.push(x)) (c)
	a.produce(0)
	a.produce(1)
	b.produce(2)
	b.produce(0)
	a.produce(3)
	a.produce(0)
	assert.equal(values, [ 1, 2, 3 ])
})

test('upstream on demand producer deactivates when first merged event completes', () => {
	const values = []
	let active = false
	const a = Event.construct_on_demand_producer(produce => {
		active = true
		produce(1)
		return () => active = false
	})
	const a_x = Event.create()
	const b = Event.create()
	const c = Event.merge_2_with (a => b => a === nothing ? b : a) (Event.complete_when (a_x) (a)) (b)
	assert.equal(active, false)
	Event.calling (x => values.push(x)) (c)
	assert.equal(active, true)
	a_x.produce('x')
	assert.equal(active, false)
	assert.equal(values, [ 1 ])
})

test('upstream on demand producer deactivates when second merged event completes', () => {
	const values = []
	let active = false
	const a = Event.construct_on_demand_producer(produce => {
		active = true
		produce(1)
		return () => active = false
	})
	const a_x = Event.create()
	const b = Event.create()
	const c = Event.merge_2_with (a => b => a === nothing ? b : a) (b) (Event.complete_when (a_x) (a))
	assert.equal(active, false)
	Event.calling (x => values.push(x)) (c)
	assert.equal(active, true)
	a_x.produce('x')
	assert.equal(active, false)
	assert.equal(values, [ 1 ])
})

test('is complete after both input events are complete', () => {
	const a = Event.create()
	const b = Event.create()
	const a_x = Event.create()
	const b_x = Event.create()
	const c = Event.merge_2_with
		(a => b => a === nothing ? b : a)
		(Event.complete_when (a_x) (a))
		(Event.complete_when (b_x) (a))
	assert.equal(c.is_complete.perform(), false)
	a_x.produce('x')
	assert.equal(c.is_complete.perform(), false)
	b_x.produce('x')
	assert.equal(c.is_complete.perform(), true)
})

test('completion occurs simultaneously with completion of second input event when first input event is already complete', () => {
	const values = []
	const a = Event.create()
	const b = Event.create()
	const a_x = Event.create()
	const b_x = Event.create()
	const a_a_x = Event.complete_when (a_x) (a)
	const b_b_x = Event.complete_when (b_x) (b)
	const c = Event.merge_2_with
		(a => b => a === nothing ? b : a)
		(a_a_x)
		(b_b_x)
	const d = Event.merge_2_with (a => b => [ a, b ])
		(Event.completion (c))
		(Event.completion (b_b_x))
	Event.calling(x => values.push(x)) (d)
	assert.equal(c.is_complete.perform(), false)
	a_x.produce('x')
	assert.equal(c.is_complete.perform(), false)
	b_x.produce('x')
	assert.equal(c.is_complete.perform(), true)
	assert.equal(values, [ [ true, true ] ])
})

test('completion occurs simultaneously with completion of first input event when second input event is already complete', () => {
	const values = []
	const a = Event.create()
	const b = Event.create()
	const a_x = Event.create()
	const b_x = Event.create()
	const a_a_x = Event.complete_when (a_x) (a)
	const b_b_x = Event.complete_when (b_x) (b)
	const c = Event.merge_2_with
		(a => b => a === nothing ? b : a)
		(a_a_x)
		(b_b_x)
	const d = Event.merge_2_with (a => b => [ a, b ])
		(Event.completion (c))
		(Event.completion (a_a_x))
	Event.calling(x => values.push(x)) (d)
	assert.equal(c.is_complete.perform(), false)
	b_x.produce('x')
	assert.equal(c.is_complete.perform(), false)
	a_x.produce('x')
	assert.equal(c.is_complete.perform(), true)
	assert.equal(values, [ [ true, true ] ])
})

test('completion occurs simultaneously with completion of first and second input events when they complete simultaneously', () => {
	const values = []
	const a = Event.create()
	const b = Event.create()
	const x = Event.create()
	const a_x = Event.complete_when (x) (a)
	const b_x = Event.complete_when (x) (b)
	const c = Event.merge_2_with
		(a => b => a === nothing ? b : a)
		(a_x)
		(b_x)
	const d = Event.merge_2_with (a => b => [ a, b ])
		(Event.completion (c))
		(x)
	Event.calling(x => values.push(x)) (d)
	assert.equal(c.is_complete.perform(), false)
	x.produce('x')
	assert.equal(c.is_complete.perform(), true)
	assert.equal(values, [ [ true, 'x' ] ])
})

test('returns never event when a and b are already complete', () => {
	assert.equal(Event.merge_2_with (() => {}) (Event.never) (Event.never), Event.never)
})

test('has occurrences and completion of a when b is already complete', () => {
	const values = []
	const a = Event.create()
	const a_x = Event.create()
	const c = Event.merge_2_with
		(a => b => [ a, b ])
		(Event.complete_when (a_x) (a))
		(Event.never)
	const d = Event.merge_2_with
		(a => b => [ a, b ])
		(a_x)
		(Event.completion (c))
	Event.calling (x => values.push(x)) (c)
	Event.calling (x => values.push(x)) (d)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	a_x.produce('x')
	assert.equal(
		values,
		[
			[ 1, Event.nothing ],
			[ 2, Event.nothing ],
			[ 3, Event.nothing ],
			[ 'x', true ]
		]
	)
})

test('has occurrences and completion of b when a is already complete', () => {
	const values = []
	const b = Event.create()
	const b_x = Event.create()
	const c = Event.merge_2_with
		(a => b => [ a, b ])
		(Event.never)
		(Event.complete_when (b_x) (b))
	const d = Event.merge_2_with
		(a => b => [ a, b ])
		(b_x)
		(Event.completion (c))
	Event.calling (x => values.push(x)) (c)
	Event.calling (x => values.push(x)) (d)
	b.produce(1)
	b.produce(2)
	b.produce(3)
	b_x.produce('x')
	assert.equal(
		values,
		[
			[ 1, Event.nothing ],
			[ 2, Event.nothing ],
			[ 3, Event.nothing ],
			[ 'x', true ]
		]
	)
})

test.run()
