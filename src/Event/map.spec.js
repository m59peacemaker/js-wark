import { test } from 'zora'
import { Event } from '../index.js'
import { add, collectValues } from '../util.js'

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
