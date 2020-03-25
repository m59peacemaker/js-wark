import { test } from 'zora'
import { Event } from '../index.js'
import { collectValues, identity } from '../util.js'

test('Event.combineKeyedWith', t => {
	const a = Event.create()
	const b = Event.create()
	const c = Event.map (identity) (a)
	const d = Event.combineKeyedWith (Object.entries) ({ a, b, c })
	const actual = collectValues(d)
	a.occur(0)
	b.occur(1)
	t.deepEqual(
		actual(),
		[
			[ [ 'a', 0 ], [ 'c', 0 ] ],
			[ [ 'b' , 1 ] ]
		]
	)
})
