import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event } from '../index.js'
import { produces } from './index.js'

const test = suite('produces')

test('TODO: wip', () => {
	const producer = produces([ 1, 2 ])

	const y = Event.map (x => x * 10) (producer.event)

	assert.equal(producer.caused(y), [ 10, 20 ])

	const x = Event.filter (x => x % 2 === 0) (producer.event)

	assert.equal(producer.caused(x), [ 2 ])

	const z = Event.alt (y) (x)

	assert.equal(producer.caused(z), [ 10, 2 ])

	const a = Dynamic.map (x => x + 100) (Event.hold (0) (z))

	assert.equal(producer.caused(Dynamic.updates(a)), [ 110, 102 ])
})

// TODO: remove tests for worse idea
// test('produced (produces (x)) === x', () => {
// 	assert.equal(
// 		produced(
// 			produces ([ 1, 2, 3 ])
// 		),
// 		[ 1, 2, 3 ]
// 	)
// })

// test('produced (map (f) (produces (x))) === map (f) (x)', () => {
// 	assert.equal(
// 		produced(
// 			Event.map (x => x * 10) (produces ([ 1, 2, 3 ]))
// 		),
// 		[ 10, 20, 30 ]
// 	)
// })

// test('produced (filter (f) (produces (x))) === filter (f) (x)', () => {
// 	assert.equal(
// 		produced(
// 			Event.filter (x => x % 2 === 0) (produces ([ 1, 2, 3, 4 ]))
// 		),
// 		[ 2, 4 ]
// 	)
// })

test.run()
