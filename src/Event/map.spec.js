import { test } from 'zora'
import * as Event from './'
import { add, collectValues } from '../util'

test('Event.map', t => {
	const a = Event.create()
	const b = Event.map (add(1)) (a)
	const actualA = collectValues(a)
	const actualB = collectValues(b)

	a.occur(10)
	a.occur(20)

	t.deepEqual(actualA(), [ 10, 20 ])
	t.deepEqual(actualB(), [ 11, 21 ])
})
