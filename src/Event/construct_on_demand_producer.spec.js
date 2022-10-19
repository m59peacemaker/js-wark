import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

const test = suite('Event.construct_on_demand_producer')

test(
	'calls activate function when statefully observers and deactivate function when no longer statefully observed',
	() => {
		let active = false
		const a = Event.create()
		const b = Event.switching (a)
		Event.calling (() => {}) (b)
		const c = Event.construct_on_demand_producer (_ => {
			active = true
			return () => active = false
		})
		assert.equal(active, false)
		a.produce(c)
		assert.equal(active, true)
		a.produce(Event.never)
		assert.equal(active, false)
	}
)

test.run()
