import { test } from 'zora'
import * as Event from './'
import * as Dynamic from '../Dynamic'
import { collectValues } from '../util'

test('Event.gate', t => {
	const toggleGate = Event.create()
	const gateOpen = Dynamic.toggle (true) (toggleGate)
	const event = Event.create()
	const gatedEvent = Event.gate (gateOpen) (event)
	const actual = collectValues(gatedEvent)
	event(1)
	event(2)
	toggleGate()
	event('x')
	event('xx')
	toggleGate()
	event(3)
	toggleGate()
	event('x')
	t.deepEqual(actual(), [ 1, 2, 3 ])
})
