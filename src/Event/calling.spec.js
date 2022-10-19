import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

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

test.run()
