import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event, Sample } from '../index.js'

const test = suite('Dynamic.combine')

test(`combined dynamic's initial value is the result of calling the function with an array of values of the input array of dynamics`, () => {
	assert.equal(
		Sample.get(
			Dynamic.combine
				(([ a, b, c ]) => a + b + c)
				([ Dynamic.of(1), Dynamic.of(2), Dynamic.of(3) ])
		),
		6
	)
})

test(`combined dynamic's value is updated to the result of calling the function with an array of values of the input array of dynamics after those dynamics update non-simultaneously`, () => {
	const a = Dynamic.create('Hello')
	const b = Dynamic.create(', ')
	const c = Dynamic.create('world')
	const d = Dynamic.combine (x => x.join('')) ([ a, b, c ])

	a.updates.produce('Hi')

	assert.equal(Sample.get (d), 'Hi, world')

	c.updates.produce('friend!')

	assert.equal(Sample.get (d), 'Hi, friend!')

	b.updates.produce('... ')

	assert.equal(Sample.get (d), 'Hi... friend!')
})

test(`combined dynamic's value is updated to the result of calling the function with an array of values of the input array of dynamics after those dynamics update simultaneously`, () => {
	const a = Dynamic.create(1)
	const b = Dynamic.create(2)
	const c = Dynamic.map (x => x * 10) (a)
	const d = Dynamic.combine (([ a, b, c ]) => a + b + c) ([ a, b, c ])

	// 1 + 2 + (1 * 10)
	assert.equal(Sample.get (d), 13)

	a.updates.produce(10)

	// 10 + 2 + (10 * 10)
	assert.equal(Sample.get (d), 112)

	b.updates.produce(7)

	a.updates.produce(3)

	// 3 + 7 + (3 * 10)
	assert.equal(Sample.get (d), 40)
})

test(`combined dynamic's value is updated to the result of calling the function with an array of values of the input array of dynamics after those dynamics update simultaneously`, () => {
	const a = Dynamic.create(1)
	const b = Dynamic.create(2)
	const c = Dynamic.map (x => x * 10) (a)
	const d = Dynamic.combine (([ a, b, c ]) => a + b + c) ([ a, b, c ])

	// 1 + 2 + (1 * 10)
	assert.equal(Sample.get (d), 13)

	a.updates.produce(10)

	// 10 + 2 + (10 * 10)
	assert.equal(Sample.get (d), 112)

	b.updates.produce(7)

	a.updates.produce(3)

	// 3 + 7 + (3 * 10)
	assert.equal(Sample.get (d), 40)
})

test(`combined dynamic's updates occur with its updated values`, () => {
	const a = Dynamic.create(1)
	const b = Dynamic.create(2)
	const c = Dynamic.map (x => x * 10) (a)
	const d = Dynamic.combine (([ a, b, c ]) => a + b + c) ([ a, b, c ])

	const values = []
	
	Event.calling (x => values.push(x)) (Dynamic.updates (d))

	// 1 + 2 + (1 * 10)
	assert.equal(Sample.get (d), 13)

	a.updates.produce(10)

	// 10 + 2 + (10 * 10)
	assert.equal(Sample.get (d), 112)

	b.updates.produce(7)
	// 10 + 7 + (10 * 10)

	a.updates.produce(3)

	// 3 + 7 + (3 * 10)
	assert.equal(Sample.get (d), 40)

	assert.equal(values, [ 112, 117, 40 ])
})

test(`combined dynamic's updates complete when updates of input dynamics complete`, () => {
	const a_updates = Event.create()
	const a_updates_completion = Event.create()
	const a = Event.hold (0) (Event.complete_on (a_updates_completion) (a_updates))
	const b = Dynamic.map (x => x + 1) (a)
	const c_updates = Event.create()
	const c_updates_completion = Event.create()
	const c = Event.hold (2) (Event.complete_on (c_updates_completion) (c_updates))
	const d = Dynamic.combine (([ a, b, c ]) => [ a, b, c ]) ([ a, b, c ])

	const values = []
	Event.calling (x => values.push(x)) (Event.completion (Dynamic.updates (d)))

	assert.equal(Sample.get (Event.completed (Dynamic.updates (d))), false)

	assert.equal(Sample.get (d), [ 0, 1, 2 ])

	c_updates_completion.produce('x')

	assert.equal(Sample.get (Event.completed (Dynamic.updates (d))), false)

	assert.equal(values, [])

	a_updates_completion.produce('x')

	assert.equal(Sample.get (Event.completed (Dynamic.updates (d))), true)

	assert.equal(values, [ true ])

	a_updates_completion.produce('x')

	assert.equal(values, [ true ])

	c_updates_completion.produce('x')

	assert.equal(values, [ true ])
})

test.run()
