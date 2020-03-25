import { test } from 'zora'
import { Behavior, Dynamic, Event } from '../index.js'

test('Dynamic.isDynamic', t => {
	t.equal(Dynamic.isDynamic(Dynamic.assemble (Behavior.create(() => {})) (Event.never())), true)
	t.equal(Dynamic.isDynamic(Dynamic.constant()), true)
	t.equal(Dynamic.isDynamic(Dynamic.constant(false)), true)
	t.equal(Dynamic.isDynamic(Dynamic.constant(false)), true)

	t.equal(Dynamic.isDynamic({}), false)
	t.equal(Dynamic.isDynamic(Event.never()), false)
})
