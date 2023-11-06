import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event } from '../index.js'

const test = suite('Dynamic.join')

test('switches between two dynamics with non-simultaneous updates', () => {
	const a = Dynamic.create('a')
	const b = Dynamic.create(0)
	const c = Dynamic.create(a)
	const d = Dynamic.join (c)

	const values = []

	Event.calling (x => values.push(x)) (Dynamic.updates (d))

	assert.equal(d.perform(), 'a')
	c.updates.produce(b)
	assert.equal(d.perform(), 0)
	c.updates.produce(a)
	b.updates.produce(1)
	assert.equal(d.perform(), 'a')
	a.updates.produce('b')
	assert.equal(d.perform(), 'b')
	c.updates.produce(b)
	assert.equal(d.perform(), 1)
	a.updates.produce('x')
	a.updates.produce('c')
	assert.equal(d.perform(), 1)
	b.updates.produce(2)
	assert.equal(d.perform(), 2)
	b.updates.produce(3)
	assert.equal(d.perform(), 3)
	c.updates.produce(a)
	a.updates.produce('d')
	assert.equal(d.perform(), 'd')
	b.updates.produce('x')
	assert.equal(d.perform(), 'd')

	assert.equal(values, [ 0, 'a', 'b', 1, 2, 3, 'c', 'd' ])
})

test('switches between two dynamics with simultaneous updates by updating to the new inner dynamic value', () => {
	const a = Dynamic.create(0)
	const b = Dynamic.map (x => `${x}b`) (a)
	const c = Dynamic.map (x => `${x}c`) (a)
	const d = Dynamic.create(b)
	const e = Dynamic.join (d)

	const values = []

	Event.calling (x => values.push(x)) (Dynamic.updates (e))

	assert.equal(e.perform(), '0b')
	a.updates.produce(1)
	assert.equal(e.perform(), '1b')
	a.updates.produce(2)
	assert.equal(e.perform(), '2b')
	d.updates.produce(c)
	assert.equal(e.perform(), '2c')
	a.updates.produce(3)
	assert.equal(e.perform(), '3c')
	d.updates.produce(b)
	assert.equal(e.perform(), '3b')
	a.updates.produce(4)
	assert.equal(e.perform(), '4b')

	assert.equal(values, [ '1b', '2b', '2c', '3c', '3b', '4b' ])
})

test('`join (map (() => x) (x))` is equivalent to `x`', () => {
	const x = Dynamic.create(0)
	const y = Dynamic.join (Dynamic.map (() => x) (x))

	const values = []

	Event.calling
		(x => values.push(x))
		(Dynamic.updates (y))

	assert.equal(y.perform(), 0)
	x.updates.produce(1)
	assert.equal(y.perform(), 1)
	x.updates.produce(2)
	assert.equal(y.perform(), 2)

	assert.equal (values, [ 1, 2 ])
})

test('map to join, all simultaneously updating', () => {
	const values = []

	const a = Dynamic.create(0)
	const b = Dynamic.map (() => a) (a)
	const c = Dynamic.map
		(() => Dynamic.join (b))
		(a)
	const d = Dynamic.join (c)
	const e = Event.calling
		(x => values.push(x))
		(Dynamic.updates (d))

	assert.equal(d.perform(), 0)
	a.updates.produce(10)
	assert.equal(d.perform(), 10)
	a.updates.produce(100)
	assert.equal(d.perform(), 100)

	assert.equal (values, [ 10, 100 ])
})

test(
	'updates complete on inner dynamic updates completion when outer dynamic updates already complete',
	() => {
		const outer_dynamic_updates = Event.create()
		const outer_dynamic_updates_completion = Event.create()
		const foo_updates = Event.create()
		const foo_completion = Event.create()
		const foo = Event.hold (0) (Event.complete_on (foo_completion) (foo_updates))
		const joined_dynamic = Dynamic.join (
			Event.hold
				(foo)
				(Event.complete_on (outer_dynamic_updates_completion) (outer_dynamic_updates))
		)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (Dynamic.updates (joined_dynamic))
		Event.calling (x => completion_update_values.push(x)) (Event.completion (Dynamic.updates (joined_dynamic)))

		foo_updates.produce(1)
		outer_dynamic_updates_completion.produce('x') // source event completes
		assert.equal(joined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates.produce(Dynamic.of('x'))
		foo_updates.produce(2)
		foo_completion.produce('x') // focused event completes
		assert.equal(joined_dynamic.updates.completed.perform(), true)
		assert.equal (completion_update_values, [ true ])

		foo_updates.produce(3)

		assert.equal (values, [ 1, 2 ])
	}
)

test(
	'completes on outer dynamic updates completion when inner dynamic updates already complete',
	() => {
		const outer_dynamic_updates = Event.create()
		const outer_dynamic_updates_completion = Event.create()
		const foo = Dynamic.create(0)
		const joined_dynamic = Dynamic.join (
			Event.hold
				(foo)
				(Event.complete_on (outer_dynamic_updates_completion) (outer_dynamic_updates))
		)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (Dynamic.updates (joined_dynamic))
		Event.calling (x => completion_update_values.push(x)) (Event.completion (Dynamic.updates (joined_dynamic)))

		foo.updates.produce(1)
		outer_dynamic_updates.produce(Dynamic.of(2)) // focused event is complete
		assert.equal(joined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates_completion.produce('x') // source event is complete
		assert.equal(joined_dynamic.updates.completed.perform(), true)
		assert.equal (completion_update_values, [ true ])

		outer_dynamic_updates_completion.produce('x')
		outer_dynamic_updates.produce(foo)
		foo.updates.produce('x')
		outer_dynamic_updates_completion.produce('x')

		assert.equal (values, [ 1, 2 ])
	}
)

test(
	'updates complete on simultaneous outer dynamic updates completion and inner dynamic updates completion',
	() => {
		const outer_dynamic_updates = Event.create()
		const outer_dynamic_updates_completion = Event.create()
		const foo_updates = Event.create()
		const foo = Event.hold (0) (Event.complete_on (outer_dynamic_updates_completion) (foo_updates))
		const joined_dynamic = Dynamic.join (
			Event.hold
				(foo)
				(Event.complete_on (outer_dynamic_updates_completion) (outer_dynamic_updates))
		)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (Dynamic.updates(joined_dynamic))
		Event.calling (x => completion_update_values.push(x)) (Event.completion (Dynamic.updates (joined_dynamic)))

		foo_updates.produce(1)

		assert.equal(joined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates_completion.produce('x')
		assert.equal(joined_dynamic.updates.completed.perform(), true)
		assert.equal (completion_update_values, [ true ])

		foo_updates.produce(2)
		outer_dynamic_updates.produce(foo)
		foo_updates.produce(3)

		assert.equal (values, [ 1 ])
	}
)

test(
	'updates complete on simultaneous outer dynamic update occurrence and completion, inner dynamic updates already complete',
	() => {
		const outer_dynamic_updates = Event.create()
		const foo = Dynamic.create(0)
		const bar = Dynamic.of(2)
		const joined_dynamic = Dynamic.join (
			Event.hold
				(foo)
				(
					Event.complete_on
						(Event.filter (x => x === bar) (outer_dynamic_updates))
						(outer_dynamic_updates)
				)
		)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (Dynamic.updates (joined_dynamic))
		Event.calling (x => completion_update_values.push(x)) (Event.completion (Dynamic.updates (joined_dynamic)))

		foo.updates.produce(1)

		assert.equal(joined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates.produce(bar)
		assert.equal(joined_dynamic.updates.completed.perform(), true)
		assert.equal (completion_update_values, [ true ])

		outer_dynamic_updates.produce(foo)
		foo.updates.produce(3)

		assert.equal (values, [ 1, 2 ])
	}
)

test(
	'updates complete on simultaneous: outer dynamic update, outer dynamic updates completion, updated inner dynamic completion',
	() => {
		const outer_dynamic_updates = Event.create()
		const joined_dynamic = Dynamic.join(
			Event.hold
				(Dynamic.of(0))
				(Event.complete_on (outer_dynamic_updates) (outer_dynamic_updates))
		)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (Dynamic.updates (joined_dynamic))
		Event.calling (x => completion_update_values.push(x)) (Event.completion (Dynamic.updates (joined_dynamic)))

		assert.equal(joined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates.produce(
			Event.hold
				(1)
				(Event.complete_on (outer_dynamic_updates) (Event.create()))
		)
		assert.equal(joined_dynamic.updates.completed.perform(), true)
		assert.equal (completion_update_values, [ true ])

		assert.equal (values, [ 1 ])
	}
)

test(
	'updates complete on simultaneous: outer dynamic update, outer dynamic updates completion, updated inner dynamic update, updated inner dynamic completion',
	() => {
		const outer_dynamic_updates = Event.create()
		const joined_dynamic = Dynamic.join(
			Event.hold
				(Dynamic.of(0))
				(Event.complete_on (outer_dynamic_updates) (outer_dynamic_updates))
		)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (Dynamic.updates (joined_dynamic))
		Event.calling (x => completion_update_values.push(x)) (Event.completion (Dynamic.updates (joined_dynamic)))

		assert.equal(joined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates.produce(
			Event.hold
				(0)
				(Event.complete_on (outer_dynamic_updates) (Event.map (() => 1) (outer_dynamic_updates)))
		)
		assert.equal(joined_dynamic.updates.completed.perform(), true)
		assert.equal (completion_update_values, [ true ])

		assert.equal (values, [ 1 ])
	}
)

test(
	'updates do not complete on simultaneous: outer dynamic update, outer dynamic updates completion, former inner dynamic updates completion (updated inner dynamic updates not complete/completing or occurring).',
	() => {
		const outer_dynamic_updates = Event.create()
		const foo = Dynamic.create(0)
		const outer_dynamic_updates_completion = Event.filter (x => x === foo) (outer_dynamic_updates)
		const outer_dynamic_updates_completion_once = Event.complete_on (outer_dynamic_updates_completion) (outer_dynamic_updates_completion)
		const unjoined_dynamic = Event.hold
			(Dynamic.of(0))
			(Event.complete_on (outer_dynamic_updates_completion) (outer_dynamic_updates))
		const joined_dynamic = Dynamic.join (unjoined_dynamic)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (Dynamic.updates (joined_dynamic))
		Event.calling (x => completion_update_values.push(x)) (Event.completion (Dynamic.updates (joined_dynamic)))

		assert.equal(outer_dynamic_updates_completion_once.completed.perform(), false)
		assert.equal(unjoined_dynamic.updates.completed.perform(), false)
		assert.equal(joined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates.produce(Event.hold (0) (outer_dynamic_updates_completion_once))
		assert.equal(outer_dynamic_updates_completion_once.completed.perform(), false)
		assert.equal(unjoined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates.produce(foo)
		assert.equal(outer_dynamic_updates_completion_once.completed.perform(), true)
		assert.equal(unjoined_dynamic.updates.completed.perform(), true)
		assert.equal(joined_dynamic.updates.completed.perform(), false)

		assert.equal (values, [ 0, 0 ])
		assert.equal (completion_update_values, [])
	}
)

test(
	'updates do not complete on simultaneous: outer dynamic update, outer dynamic updates completion, former inner dynamic updates completion, updated inner dynamic update (and updated inner dynamic updates not complete/completing).',
	() => {
		const outer_dynamic_updates = Event.create()
		const outer_dynamic_updates_completion = Event.filter (x => x === foo) (outer_dynamic_updates)
		const outer_dynamic_updates_completion_once = Event.complete_on
			(outer_dynamic_updates_completion)
			(outer_dynamic_updates_completion)
		const unjoined_dynamic = Event.hold
			(Dynamic.of(0))
			(Event.complete_on (outer_dynamic_updates_completion) (outer_dynamic_updates))
		const joined_dynamic = Dynamic.join (unjoined_dynamic)
		const foo = Event.hold (0) (Event.map (() => 1) (outer_dynamic_updates))

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (Dynamic.updates (joined_dynamic))
		Event.calling (x => completion_update_values.push(x)) (Event.completion (Dynamic.updates (joined_dynamic)))

		assert.equal(outer_dynamic_updates_completion_once.completed.perform(), false)
		assert.equal(unjoined_dynamic.updates.completed.perform(), false)
		assert.equal(joined_dynamic.updates.completed.perform(), false)
		outer_dynamic_updates.produce(Event.hold (0) (outer_dynamic_updates_completion_once))
		outer_dynamic_updates.produce(foo)
		assert.equal(outer_dynamic_updates_completion_once.completed.perform(), true)
		assert.equal(unjoined_dynamic.updates.completed.perform(), true)
		assert.equal(joined_dynamic.updates.completed.perform(), false)

		assert.equal (values, [ 0, 1 ])
		assert.equal (completion_update_values, [])
	}
)

test.run()
