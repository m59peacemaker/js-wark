import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

const test = suite('Event.merge_array')

test('', () => {
	const values = []
	const a = Event.exposed_producer()
	const b = Event.exposed_producer()
	const c = Event.map (x => x + 100) (b)
	const d = Event.merge_array ([ a, b, c ])
	Event.calling (x => values.push(x)) (d)

	a.produce(1)
	b.produce(2)
	a.produce(3)
	b.produce(4)
	b.produce(5)
	
	assert.equal(
		values,
		[
			[ 1, Event.nothing, Event.nothing ],
			[ Event.nothing, 2, 102 ],
			[ 3, Event.nothing, Event.nothing ],
			[ Event.nothing, 4, 104 ],
			[ Event.nothing, 5, 105 ]
		]
	)
})

test.run()
