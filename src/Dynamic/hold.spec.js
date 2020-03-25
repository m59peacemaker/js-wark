import { test } from 'zora'
import { Dynamic, Event } from '../index.js'
import { collectValues } from '../util.js'

test('Dynamic.hold', t => {
	const event = Event.create()
	const dynamic = Dynamic.hold (0) (event)
	const actual = collectValues(dynamic)
	event.occur(1)
	event.occur(2)
	event.occur(3)
	t.equal(actual(), [ 0, 1, 2, 3 ])
})
