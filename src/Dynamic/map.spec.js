import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from '../Event/index.js'
import * as Dynamic from './index.js'

const test = suite('Dynamic.map')

test('transforms Dynamic X to Dynamic Y via the input function X -> Y', () => {
	const a = Dynamic.create(0)
	const b = Dynamic.map (x => x + 1) (a)
	const values = []
	Event.calling (x => values.push(x)) (b.updates)

	a.updates.produce (1)
	a.updates.produce (2)
	a.updates.produce (3)

	assert.equal (values, [ 2, 3, 4 ])
})

test.run()
