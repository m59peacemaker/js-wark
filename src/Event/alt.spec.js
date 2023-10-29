import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { nothing } from './nothing.js'
import * as Event from './index.js'

const test = suite('Event.alt')

test('has the occurrences of both input events when they do not occur simultaneously', () => {
	const values = []
	const a = Event.create()
	const b = Event.create()
	const c = Event.alt (b) (a)
	Event.calling (x => values.push(x)) (c)
	a.produce(1)
	b.produce(2)
	b.produce(3)
	a.produce(4)
	b.produce(5)
	assert.equal(values, [ 1, 2, 3, 4, 5 ])
})

test('has the occurrence of `a` when `a` and `b` occur simultaneously', () => {
	const values = []
	const a = Event.create()
	const b = Event.map (_ => 'x') (a)
	const c = Event.alt (b) (a)
	Event.calling (x => values.push(x)) (c)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	assert.equal(values, [ 1, 2, 3 ])
})

test('has the occurrence of `b` after `a` has completed, `a and `b` otherwise occuring simultaneously', () => {
	const values = []
	const b = Event.create()
	const a = Event.map (x => x + 10) (b)
	const c = Event.alt (b) (Event.complete_on (a) (a))
	Event.calling (x => values.push(x)) (c)
	b.produce(0)
	b.produce(1)
	assert.equal(values, [ 10, 1 ])
})

test.run()
