import { test } from 'zora'
import * as Event from './'
import { add, collectValues, pipe } from '../util'

test('Event.filter', t => {
	const a = Event.create()
	const b = pipe ([
		Event.map (add(10)),
		Event.filter (v => v % 2 === 0),
		Event.map (add(1)),
		Event.map (add(1)),
		Event.filter(v => v !== 18),
		Event.map (v => v * 2)
	]) (a)
	const actual = collectValues(b)

	;[ 1, 2, 3, 4, 5, 6, 7, 8 ].forEach(a.occur)

	t.deepEqual(actual(), [ 28, 32, 40 ])
})
