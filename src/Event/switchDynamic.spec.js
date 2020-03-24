import { test } from 'zora'
import * as Event from './'
import * as Dynamic from '../Dynamic'

test('Event.switchDynamic', t => {
	const a = Event.create()
	const b = Event.create()
	const c = Event.create()
	const eventOfEvent = Event.create()
	const dynamicEvent = Dynamic.hold (a) (eventOfEvent)
	const d = Event.switchDynamic (dynamicEvent)
	const holdD = Dynamic.hold (null) (d)
	a.occur(1)
	t.equal(holdD.sample(), 1)
	a.occur(2)
	t.equal(holdD.sample(), 2)
	eventOfEvent.occur(b)
	b.occur(3)
	t.equal(holdD.sample(), 3)
	eventOfEvent.occur(a)
	b.occur('x')
	t.equal(holdD.sample(), 3)
	a.occur(4)
	b.occur('x')
	t.equal(holdD.sample(), 4)
	eventOfEvent.occur(c)
	eventOfEvent.occur(b)
	c.occur('x')
	t.equal(holdD.sample(), 4)
	b.occur(5)
	t.equal(holdD.sample(), 5)
	eventOfEvent.occur(c)
	c.occur(6)
	t.equal(holdD.sample(), 6)
})
