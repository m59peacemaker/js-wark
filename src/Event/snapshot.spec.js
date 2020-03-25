import { test } from 'zora'
import { Behavior, Event, Dynamic } from '../index.js'
import { collectValues } from '../util.js'

test('Event.snapshot', t => {
	t.test('continuous behavior', t => {
		const a = Event.create()
		const behaviorValues = [ 1, 2, 3 ]
		const b = Behavior.create(() => behaviorValues.shift())
		const c = Event.snapshot (b => a => [ b, a ]) (b) (a)
		const actual = collectValues(c)
		a.occur(0)
		a.occur(0)
		a.occur(0)
		t.deepEqual(actual(), [ [ 1, 0 ], [ 2, 0 ], [ 3, 0 ] ])
	})
	t.test('dynamic snapshotted from the same event that updates it', t => {
		const a = Event.create()
		const b = Dynamic.hold (0) (a)
		const c = Event.snapshot (b => a => [ b, a ]) (b) (a)
		const actual = collectValues(c)
		a.occur(1)
		a.occur(2)
		a.occur(3)
		t.deepEqual(actual(), [ [ 1, 1 ], [ 2, 2 ], [ 3, 3 ] ])
	})
	t.test('dynamic snapshotted by event that is not the same one that updates it', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Dynamic.hold (0) (a)
		const d = Event.snapshot (b => a => [ b, a ]) (c) (b)
		const actual = collectValues(d)
		a.occur(1)
		t.equal(c.sample(), 1)
		a.occur(2)
		t.equal(c.sample(), 2)
		b.occur(5)
		b.occur(10)
		a.occur(3)
		a.occur(4)
		b.occur(15)
		t.deepEqual(actual(), [ [ 2, 5 ], [ 2, 10 ], [ 4, 15 ] ])
	})
})
