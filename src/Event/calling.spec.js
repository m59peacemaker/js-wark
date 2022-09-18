import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'
import { promise_wait } from '../test/util.js'

const test = suite('Event.calling')

test('direct transformation of on demand producer, observes every value of producer', () => {
	const a = Event.on_demand_producer(produce => {
		setTimeout(() => produce(0), 0)
		setTimeout(() => produce(1), 100)
	})
	const values = []
	Event.calling (x => values.push(x)) (a)
	return promise_wait (200)
		.then(() => assert.equal(values, [ 0, 1 ]))
})

test.run()
