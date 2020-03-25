import { test } from 'zora'
import { Dynamic, Event } from '../index.js'
import { collectValues } from '../util.js'

test('Dynamic.chain', t => {
	const valueUpdate = Event.create()
	const value = Dynamic.hold (0) (valueUpdate)
	const dynamics = {
		identity: value,
		mapped: Dynamic.map (v => v + 1) (value),
		filtered: Dynamic.filter (v => v % 2 === 0) (value)
	}
	const dynamicSelectEvent = Event.create()
	const selectedDynamic = Dynamic.hold ('identity') (dynamicSelectEvent)
	const dynamicDynamic = Dynamic.chain (name => dynamics[name]) (selectedDynamic)
	const actual = collectValues(dynamicDynamic.update)

	t.equal(value.sample(), 0)
	t.equal(dynamicDynamic.sample(), 0)

	valueUpdate.occur(1)

	t.equal(value.sample(), 1)
	t.equal(dynamicDynamic.sample(), 1)
	t.deepEqual(actual(), [ 1 ])

	dynamicSelectEvent.occur('mapped')

	t.equal(dynamicDynamic.sample(), 2)
	t.deepEqual(actual(), [ 1, 2 ])

	valueUpdate.occur(2)

	t.equal(dynamicDynamic.sample(), 3)
	t.deepEqual(actual(), [ 1, 2, 3 ])

	dynamicSelectEvent.occur('filtered')

	t.equal(dynamicDynamic.sample(), 2)
	t.deepEqual(actual(), [ 1, 2, 3, 2 ])
})
