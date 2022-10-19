import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event } from '../index.js'
import { nothing } from './nothing.js'

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

// TODO: test returning `nothing`

test.run()
