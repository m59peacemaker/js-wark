import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event } from '../index.js'

const test = suite('Event.calling')

test('catches up and occurs when input event is occurring during the instant of creation', () => {
	const values = []
	let i = 0
	const a = Event.create()
	Event.calling
		(() => {
			const n = ++i
			Event.calling (x => values.push([ n, x ])) (a)
		})
		(a)
	a.produce('a')
	a.produce('b')
	assert.equal(
		values,
		[
			[ 1, 'a' ],
			[ 1, 'b' ],
			[ 2, 'b' ]
		]
	)
})

test('completes when input event completes not-simultaneously with input event occurrence', () => {
	const a = Event.create()
	const ax = Event.create()
	const values = []
	// const completion_values = []
	Event.calling
		(x => values.push(x))
		(Event.complete_on (ax) (a))
	a.produce('a')
	a.produce('b')
	ax.produce('-')
	a.produce('c')
	assert.equal(
		values,
		[
			'a',
			'b',
		]
	)
})

test('has no further occurrences after input event completes not-simultaneously with input event occurrence', () => {
	const a = Event.create()
	const ax = Event.create()
	const values = []
	// const completion_values = []
	Event.calling
		(x => values.push(x))
		(Event.complete_on (ax) (a))
	a.produce('a')
	a.produce('b')
	ax.produce('-')
	a.produce('c')
	assert.equal(
		values,
		[
			'a',
			'b',
		]
	)
})

test('has no further occurrences after input event completes simultaneously with input event occurrence', () => {
	const a = Event.create()
	const values = []
	// const completion_values = []
	Event.calling
		(x => values.push(x))
		(Event.complete_on (a) (a))
	a.produce('a')
	a.produce('b')
	assert.equal(
		values,
		[
			'a'
		]
	)
})

test.run()
