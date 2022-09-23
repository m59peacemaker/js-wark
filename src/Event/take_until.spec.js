import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'
import { promise_wait } from '../test/util.js'

const test = suite('Event.take_until')

// TODO: test that event completes while not otherwise observed by composing with it after it should have completed
// TODO: test that gc cleans it up when appropriate

test('does not occur after input complete event occurs', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const c = Event.take_until (b) (a)
	Event.calling
		(x => values.push(x))
		(c)
	a.produce(1)
	a.produce(2)
	b.produce('x')
	a.produce(3)
	a.produce(4)
	assert.equal(values, [ 1, 2 ])
})

test('returned event has a complete event that occurs when input complete event occurs', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.take_until (a) (a)
	Event.calling
		(x => values.push(x))
		(Event.complete (b))
	a.produce('x')
	assert.equal(values, [ 'x' ])
})

test('returned event complete event only occurs once - does not occur on subsequent occurrences of the input complete event', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.take_until (a) (a)
	Event.calling
		(x => values.push(x))
		(Event.complete (b))
	a.produce('x')
	a.produce('y')
	assert.equal(values, [ 'x' ])
})

test(`complete event of event x's complete event has the same occurrence as event x's complete event`, () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.take_until (a) (a)
	Event.calling
		(x => values.push(x))
		(Event.merge_2_with
			(a => b => [ a, b ])
			(a)
			(b)
		)
	a.produce('x')
	a.produce('y')
	assert.equal(
		values,
		[
			[ 'x', 'x' ],
			[ 'y', Event.nothing ]
		]
	)
})

test.only(`complete event of event x's complete event has the same occurrence as event x's complete event`, () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.take_until (a) (a)
	Event.calling
		(x => values.push(x))
		(Event.merge_array
			([
				a,
				b,
				Event.complete (b),
				Event.complete (Event.complete (b))
			])
		)
	a.produce('x')
	a.produce('y')
	assert.equal(
		values,
		[
			[ 'x', 'x', 'x', 'x' ],
			[ 'y', Event.nothing, Event.nothing, Event.nothing ]
		]
	)
})

test.run()
