import { test } from 'zora'
import * as Event from './'
import { collectValues } from '../util'

test('Event.until', t => {
	const a = Event.create()
	const b = Event.create()
	const c = Event.until (b) (a)
	const actual = collectValues(c)
	a.occur(1)
	a.occur(2)
	b.occur()
	a.occur(3)
	a.occur(4)
	b.occur()
	a.occur(5)
	t.deepEqual(actual(), [ 1, 2 ])
})
