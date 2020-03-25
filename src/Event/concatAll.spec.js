import { test } from 'zora'
import { Event } from '../index.js'
import { collectValues, identity } from '../util.js'

test('Event.concatAll', t => {
	t.test('concats given events', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.create()
		const d = Event.concatAll ([ a, b, c ])
		const actual = collectValues(d)
		a.occur(1)
		a.occur(2)
		b.occur(3)
		c.occur(4)
		t.deepEqual(actual(), [ 1, 2, 3, 4 ])
	})
	t.test('throws on simultaneous occurrence', t => {
		const a = Event.create()
		const b = Event.map (identity) (a)
		const c = Event.concatAll ([ a, b ])
		try {
			a.occur()
			t.fail('did not throw on simultaneous occurrence!')
		} catch (error) {
			t.ok(true, error)
		}
	})
})
