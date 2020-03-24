import { test } from 'zora'
import * as Event from './'
import { collectValues } from '../util'

test('Event.zip', t => {
	const a = Event.create()
	const b = Event.create()
	const c = Event.zip ([ a, b ])
	const actual = collectValues(c)

	a.occur('a1')
	t.deepEqual(actual(), [ ])
	b.occur('b1')
	t.deepEqual(actual(), [ [ 'a1', 'b1' ] ])
	b.occur('b2')
	b.occur('b3')
	b.occur('b4')
	t.deepEqual(actual(), [ [ 'a1', 'b1' ] ])
	a.occur('a2')
	t.deepEqual(actual(), [ [ 'a1', 'b1' ], [ 'a2', 'b2' ] ])
	a.occur('a3')
	a.occur('a4')
	t.deepEqual(actual(), [ [ 'a1', 'b1' ], [ 'a2', 'b2' ], [ 'a3', 'b3' ], [ 'a4', 'b4' ] ])
})
