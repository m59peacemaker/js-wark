import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event } from '../index.js'

const test = suite('Dynamic.switching')

// NOTE: this is fun
test('recursive map switch can implement merge_2 for non simultaneous events', () => {
	const values = []
	const a = Event.create()
	const b = Event.create()
	const merge_2 = a => b =>
		Dynamic.switching
			(Event.hold
				(a)
				(Event.map
					(_ => merge_2 (b) (a))
					(b)
				)
			)
	const c = merge_2 (a) (b)
	Event.calling (x => values.push(x)) (c)

	a.produce(1)
	b.produce(2)
	a.produce(3)
	a.produce(4)
	b.produce(5)
	a.produce(6)

	assert.equal(values, [ 1, 2, 3, 4, 5, 6 ])
})

// TODO: this is actually just testing a recursive `map`, so it can be removed, but this loop was once incorrectly prevented with unexpected behavior and so it could be good to have a test like this somehwere
test('merge_2 built from switch is an infinite loop when the input events are simultaneous', () => {
	const error_message = 'infinite loop'
	let switches = 0

	const merge_2 = a => b =>
		Dynamic.switching (
			Event.hold
				(a)
				(Event.map
					(() => {
						++switches
						if (switches === 10) {
							throw new Error(error_message)
						}
						return merge_2 (b) (a)
					})
					(b)
				)
		)
	
	const a = Event.create()
	const b = Event.map (x => x + 100) (a)
	const c = merge_2 (a) (b)

	const values = []
	Event.calling (x => values.push(x)) (c)

	assert.throws (() => a.produce (1), error => error.message === error_message)
})

test.run()
