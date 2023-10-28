import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'
import * as Sample from '../Sample/index.js'

const test = suite('Event.snapshot')

test('`f` receives sample value and event value', () => {
	let values = []

	let a_value = 0
	const a = Sample.construct(() => a_value++)
	const b = Event.exposed_producer()
	const c = Event.snapshot (x => y => [ x, y ]) (a) (b)
	Event.calling (x => values.push(x)) (c)
	b.produce('a')
	b.produce('b')
	b.produce('c')
	
	assert.equal(values, [ [ 0, 'a' ], [ 1, 'b' ], [ 2, 'c' ] ])
})

test('sample value is the same at the same moment of time', () => {
	let values = []

	let a_value = 0
	const a = Sample.construct(() => a_value++)
	const b = Event.exposed_producer()
	const c = Event.snapshot (x => y => [ x, y ]) (a) (b)
	const d = Event.snapshot (x => y => [ x, y ]) (a) (Event.map (a => a + a) (b))
	Event.calling (x => values.push(x)) (c)
	Event.calling (x => values.push(x)) (d)
	b.produce('a')
	b.produce('b')
	b.produce('c')
	
	assert.equal(values, [
		[ 0, 'a' ],
		[ 0, 'aa' ],
		[ 1, 'b' ],
		[ 1, 'bb' ],
		[ 2, 'c' ],
		[ 2, 'cc' ]
	])
})

test.run()
