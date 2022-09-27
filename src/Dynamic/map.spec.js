import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event } from '../index.js'

const test = suite('Dynamic.map')

test('transforms Dynamic X to Dynamic Y via the input function X -> Y', () => {
	const a = Dynamic.create(0)
	const b = Dynamic.map (x => x + 1) (a)
	const values = []
	Event.calling (x => values.push(x)) (Dynamic.updates(b))

	a.updates.produce (1)
	a.updates.produce (2)
	a.updates.produce (3)

	assert.equal (values, [ 2, 3, 4 ])
})

test.run()
