import { test } from 'zora'
import * as Event from './'
import { collectValues, identity } from '../util'

test('Event.combineKeyed', t => {
	const a = Event.create()
	const b = Event.create()
	const c = Event.map (identity) (a)
	const d = Event.combineKeyed({ a, b, c })
	const actual = collectValues(d)
	a.occur(0)
	b.occur(1)
	t.deepEqual(actual(), [ { a: 0, c: 0 }, { b: 1 } ])
})


