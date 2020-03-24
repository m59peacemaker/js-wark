import { test } from 'zora'
import * as Event from './'
import { add, collectValues, identity } from '../util'

test('Event.switchMap', t => {
	t.test('has the occurrences of only the most recent event', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.create()
		const d = Event.switchMap (v => v) (c)

		const actual = collectValues(d)

		c.occur(a)
		a.occur(1)
		a.occur(2)

		c.occur(b)
		b.occur(3)
		b.occur(4)
		a.occur('x')
		b.occur(5)

		c.occur(a)
		a.occur(6)
		b.occur('x')
		a.occur(7)

		c.occur(b)
		b.occur(8)

		t.deepEqual(actual(), [ 1, 2, 3, 4, 5, 6, 7, 8 ])
	})

	t.test('does not break the next operator', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.create()
		const d = Event.switchMap (v => v) (c)
		const e = Event.map (add(1)) (d)

		const actual = collectValues(e)

		c.occur(a)
		a.occur(1)
		a.occur(2)
		c.occur(b)
		b.occur(3)
		b.occur(4)
		a.occur('x')
		b.occur(5)
		c.occur(a)
		a.occur(6)
		b.occur('x')
		a.occur(7)
		c.occur(b)
		b.occur(8)

		t.deepEqual(actual(), [ 2, 3, 4, 5, 6, 7, 8, 9 ])
	})

	t.test('works with other switching events', t => {
		const a = Event.create()
		const b = Event.create()
		const eventOfEvent1 = Event.create()
		const eventOfEvent2 = Event.create()
		const switch1 = Event.switchMap (identity) (eventOfEvent1)
		const switch2 = Event.switchMap (identity) (eventOfEvent2)
		const eventOfSwitches = Event.create()
		const switchOfSwitches = Event.switchMap (identity) (eventOfSwitches)

		const actual = collectValues(switchOfSwitches)

		eventOfSwitches.occur(switch1)
		eventOfEvent1.occur(a)
		a.occur(5)
		eventOfEvent1.occur(b)
		a.occur('x')
		b.occur(10)
		eventOfEvent1.occur(a)
		a.occur(15)
		eventOfSwitches.occur(switch2)
		a.occur('x')
		b.occur('x')
		eventOfEvent2.occur(a)
		b.occur('x')
		a.occur(20)
		eventOfEvent2.occur(b)
		b.occur(25)
		eventOfSwitches.occur(switch1)
		b.occur('x')
		a.occur(30)

		t.deepEqual(actual(), [ 5, 10, 15, 20, 25, 30 ])
	})
})
