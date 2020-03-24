import { test } from 'zora'
import * as Event from './'
import { collectValues } from '../util'

test('Event.concat', t => {
	t.test('concats given events', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.concat (a) (b)
		const actual = collectValues(c)
		a.occur(1)
		a.occur(2)
		b.occur(3)
		a.occur(4)
		t.deepEqual(actual(), [ 1, 2, 3, 4 ])
	})
})
