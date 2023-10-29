import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Event from './index.js'

const test = suite('Event.switching')

test('switches between two non-simultaneous producers', () => {
	const a = Event.create()
	const b = Event.create()
	const c = Event.create()
	const d = Event.switching (c)
	const values = []
	Event.calling (x => values.push(x)) (d)

	c.produce(a)
	a.produce(1)
	a.produce(2)
	c.produce(b)
	a.produce('x')
	b.produce(3)
	b.produce(4)
	c.produce(a)
	b.produce('x')
	a.produce(5)

	assert.equal (values, [ 1, 2, 3, 4, 5 ])
})

test('`switching (map (() => x) (x))` is equivalent to `x`', () => {
	const values = []
	const x = Event.create()
	Event.calling
		(x => values.push(x))
		(Event.switching (Event.map (() => x) (x)))

	x.produce(0)
	x.produce(1)

	assert.equal (values, [ 0, 1 ])
})

test('map to switch, all simultaneous', () => {
	const values = []
	const a = Event.create()
	const b = Event.calling (() => a) (a)
	const c = Event.calling
		(() => Event.switching (b))
		(a)
	const d = Event.switching (c)
	const e = Event.calling
		(x => values.push(x))
		(d)

	a.produce(0)
	a.produce(10)

	assert.equal (values, [ 0, 10 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.create()
	const b = Event.map (x => x + 100) (a)
	const c = Event.map (() => Event.switching (Event.map (() => a) (b))) (b)
	const d = Event.switching (c)
	Event.calling
		(x => values.push(x))
		(d)

	a.produce(0)
	a.produce(10)

	assert.equal (values, [ 0, 10 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.create()
	const b = Event.map
		(() => Event.map (() => a) (a))
		(a)
	const c = Event.switching (b)
	const d = Event.switching (c)
	Event.calling
		(x => values.push(x))
		(d)
	a.produce(0)
	a.produce(1)
	assert.equal(values, [ 0, 1 ])
})

test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.create()
	const b = Event.map
		(() => Event.map (() => a) (a))
		(a)
	/*
		b occurs when a occurs.
		b's value is an event that occurs when `a` occurs, with a value of `a` itself.
		`a` is Event Number
		`b` is Event Event Event Number
		c switches when b occurs.
		c's `x` is the value of `b` (see above).
		The event that c switches to is a switch that:
			Its `x` is the value of `b`: Event Event Number
			switches when `x` occurs (when `a` occurs),
			its `y` is the value of `x`:
			Event Number
			which is `a`.
	*/
	const c = Event.switching
		(Event.map
			(Event.switching)
			(b)
		)
	Event.calling
		(x => values.push(x))
		(c)
	a.produce(0)
	a.produce(1)
	assert.equal(values, [ 0 , 1 ])
})

test('map in simultaneous switch', () => {
	const values = []
	const a = Event.create()
	const b = Event.switching
		(Event.map
			(() => Event.map (x => x + 10) (a))
			(a)
		)
	Event.calling
		(x => values.push(x))
		(b)
	a.produce(0)
	a.produce(1)
	a.produce(2)

	assert.equal(values, [ 10, 11, 12 ])
})

test('switch to simultaneous in simultaneous switch', () => {
	const values = []
	const a = Event.create()
	const b = Event.switching
		(Event.map
			(() => Event.switching (Event.map(() => a) (a)))
			(a)
		)
	Event.calling
		(x => values.push(x))
		(b)
	a.produce(0)
	a.produce(1)
	a.produce(2)

	assert.equal(values, [ 0, 1, 2 ])
})

test('switch to switch in map in map, all simultaneous', () => {
	const values = []
	const a = Event.create()
	const b = Event.map (x => Event.map (y => x + y) (a)) (a)
	const c = Event.switching
		(Event.map
			(() => Event.switching (b))
			(a)
		)

	Event.calling
		(x => values.push(x))
		(c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal (values, [ 2, 4, 6 ])
})

test('switch to map to switch, all simultaneous', () => {
	const values = []
	const a = Event.create()
	const b = Event.map (() => Event.switching (Event.map (() => a) (a))) (a)
	const c = Event.switching (b)

	Event.calling
		(x => values.push(x))
		(c)

	a.produce(1)
	a.produce(2)
	a.produce(3)

	assert.equal (values, [ 1, 2, 3 ])
})


test('TODO: name this, nesting and simultaneity', () => {
	const values = []
	const a = Event.create()

	Event.calling
		(x => values.push(x))
		(Event.switching
			(Event.map
				(() =>
					Event.map
						(x => x + 100)
						(Event.switching (Event.map (() => a) (a)))
				)
				(Event.map (() => 'x') (a))
			)
		)

	a.produce(0)
	a.produce(10)
	a.produce(20)

	assert.equal (values, [ 100, 110, 120 ])
})

test('can implement filter (occurrences)', () => {
	const filter = f => x =>
		Event.switching
			(Event.map
				(v => f (v) ? x : Event.never)
				(x)
			)

	const values = []
	const a = Event.create()
	const b = filter (x => x % 2 === 0) (a)
	Event.calling
		(x => values.push(x))
		(b)
	a.produce(1)
	a.produce(2)
	a.produce(3)
	a.produce(4)
	assert.equal(values, [ 2, 4 ])
})

test('can implement filter (completion)', () => {
	const filter = f => x =>
		Event.switching
			(Event.map
				(v => f (v) ? x : Event.never)
				(x)
			)

	const values = []
	const a = Event.create()
	const a_x = Event.create()
	const b = filter (x => x === 0) (Event.complete_on (a_x) (a))
	Event.calling
		(x => values.push(x))
		(Event.merge_2_with
			(a => b => [ a, b ])
			(a_x)
			(Event.completion (b))
		)
	a_x.produce(1)
	assert.equal(values, [ [ 1, true ] ])
})

test('can implement filter (completion following an occurrence)', () => {
	const filter = f => x =>
		Event.switching
			(Event.map
				(v => f (v) ? x : Event.never)
				(x)
			)

	const values = []
	const a = Event.create()
	const a_x = Event.create()
	const b = filter (x => x === 0) (Event.complete_on (a_x) (a))
	Event.calling
		(x => values.push(x))
		(Event.merge_2_with
			(a => b => [ a, b ])
			(a_x)
			(Event.completion (b))
		)
	// An initial occurrence somehow affected the outcome in the past.
	a.produce(0)
	a_x.produce(1)
	assert.equal(values, [ [ 1, true ] ])
})


test(
	'when has occurrence dependants, completes on focused event completion - source event already complete',
	() => {
		const a = Event.create()
		const a_x = Event.create()
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.create()
		const d_x = Event.create()

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (c)
		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		a.produce(Event.complete_on (d_x) (d))
		d.produce(1)
		a_x.produce('x') // source event completes
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(Event.never) // should not affect source event
		d.produce(2)
		d_x.produce('x') // focused event completes
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		d.produce(3)

		assert.equal (values, [ 1, 2 ])
		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when does not have occurrence dependants, completes on focused event completion - source event already complete',
	() => {
		const a = Event.create()
		const a_x = Event.create()
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.create()
		const d_x = Event.create()

		const completion_update_values = []

		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		a.produce(Event.complete_on (d_x) (d))
		d.produce(1)
		a_x.produce('x') // source event completes
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(Event.never) // should not affect source event
		d.produce(2)
		d_x.produce('x') // focused event completes
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		d.produce(3)

		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when has occurrence dependants, completes on source event completion - focused event already complete',
	() => {
		const a = Event.create()
		const a_x = Event.create()
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.create()

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (c)
		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		a.produce(d)
		d.produce(1)
		a.produce(Event.never) // focused event is complete
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a_x.produce('x') // source event is complete
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		a_x.produce('x')
		a.produce(d)
		d.produce('x')
		a_x.produce('x')

		assert.equal (values, [ 1 ])
		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when does not have occurrence dependants, completes on source event completion - focused event already complete',
	() => {
		const a = Event.create()
		const a_x = Event.create()
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.create()

		const completion_update_values = []

		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		a.produce(d)
		d.produce(1)
		a.produce(Event.never) // focused event is complete
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a_x.produce('x') // source event is complete
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		a_x.produce('x')
		a.produce(d)
		d.produce('x')
		a_x.produce('x')

		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when has occurrence dependants, completes on simultaneous source event completion and focused event completion',
	() => {
		const a = Event.create()
		const a_x = Event.create()
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.create()

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (c)
		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		a.produce(d)
		a.produce(Event.complete_on (a_x) (d))

		d.produce(1)

		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a_x.produce('x')
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

		d.produce(2)
		a.produce(d)
		d.produce(3)

		assert.equal (values, [ 1 ])
		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when does not have occurrence dependants, completes on simultaneous source event completion and focused event completion',
	() => {
		const a = Event.create()
		const a_x = Event.create()
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.create()

		const completion_update_values = []

		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		a.produce(d)
		a.produce(Event.complete_on (a_x) (d))

		d.produce(1)

		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a_x.produce('x')
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

		d.produce(2)
		a.produce(d)
		d.produce(3)

		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when has occurrence dependants, completes on simultaneous source event occurrence and completion, updated focused event already complete',
	() => {
		const a = Event.create()
		const b = Event.complete_on (Event.filter (x => x === Event.never) (a)) (a)
		const c = Event.switching (b)
		const d = Event.create()

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (c)
		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))


		a.produce(d)
		d.produce(1)

		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(Event.never)
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

		a.produce(d)
		d.produce(2)

		assert.equal (values, [ 1 ])
		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when does not have occurrence dependants, completes on simultaneous source event occurrence and completion, updated focused event already complete',
	() => {
		const a = Event.create()
		const b = Event.complete_on (Event.filter (x => x === Event.never) (a)) (a)
		const c = Event.switching (b)
		const d = Event.create()

		const completion_update_values = []

		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))


		a.produce(d)
		d.produce(1)

		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(Event.never)
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

		a.produce(d)
		d.produce(2)

		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when has occurrence dependants, completes on simultaneous: source event occurrence, source event completion, updated focused event completion',
	() => {
		const a = Event.create()
		const b = Event.complete_on (a) (a)
		const c = Event.switching (b)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (c)
		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(Event.complete_on (a) (Event.create()))
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

		assert.equal (values, [])
		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when does not have occurrence dependants, completes on simultaneous: source event occurrence, source event completion, updated focused event completion',
	() => {
		const a = Event.create()
		const b = Event.complete_on (a) (a)
		const c = Event.switching (b)

		const completion_update_values = []

		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(Event.complete_on (a) (Event.create()))
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when has occurrence dependants, completes and occurs on simultaneous: source event occurrence, source event completion, updated focused event occurrence, updated focused event completion',
	() => {
		const a = Event.create()
		const b = Event.complete_on (a) (a)
		const c = Event.switching (b)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (c)
		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(Event.complete_on (a) (Event.map (() => 1) (a)))
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

		assert.equal (values, [ 1 ])
		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when does not have occurrence dependants, completes on simultaneous: source event occurrence, source event completion, updated focused event occurrence, updated focused event completion',
	() => {
		const a = Event.create()
		const b = Event.complete_on (a) (a)
		const c = Event.switching (b)

		const completion_update_values = []

		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(Event.complete_on (a) (Event.map (() => 1) (a)))
		assert.equal(c.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))

		assert.equal (completion_update_values, [ true ])
	}
)

test(
	'when has occurrence dependants, does not complete on simultaneous: source event occurrence, source event completion, un-focused event completion (updated focused event not complete/completing or occurring).',
	() => {
		const a = Event.create()
		const a_x = Event.filter (x => x === d) (a)
		const a_x_once = Event.complete_on (a_x) (a_x)
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.create()

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (c)
		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		assert.equal(a_x_once.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(a_x_once)
		assert.equal(a_x_once.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(d)
		assert.equal(a_x_once.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))

		assert.equal (values, [])
		assert.equal (completion_update_values, [])
	}
)

test(
	'when does not have occurrence dependants, does not complete on simultaneous: source event occurrence, source event completion, un-focused event completion (updated focused event not complete/completing or occurring).',
	() => {
		const a = Event.create()
		const a_x = Event.filter (x => x === d) (a)
		const a_x_once = Event.complete_on (a_x) (a_x)
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.create()

		const completion_update_values = []

		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		assert.equal(a_x_once.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(a_x_once)
		assert.equal(a_x_once.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(d)
		assert.equal(a_x_once.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))

		assert.equal (completion_update_values, [])
	}
)

test(
	'when has occurrence dependants, does not complete on simultaneous: source event occurrence, source event completion, un-focused event completion, updated focused event occurrence (and not complete/completing).',
	() => {
		const a = Event.create()
		const a_x = Event.filter (x => x === d) (a)
		const a_x_once = Event.complete_on (a_x) (a_x)
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.map (() => 1) (a)

		const values = []
		const completion_update_values = []

		Event.calling (x => values.push(x)) (c)
		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		assert.equal(a_x_once.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(a_x_once)
		a.produce(d)
		assert.equal(a_x_once.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))

		assert.equal (values, [ 1 ])
		assert.equal (completion_update_values, [])
	}
)

test(
	'when does not have occurrence dependants, does not complete on simultaneous: source event occurrence, source event completion, un-focused event completion, updated focused event occurrence (and not complete/completing).',
	() => {
		const a = Event.create()
		const a_x = Event.filter (x => x === d) (a)
		const a_x_once = Event.complete_on (a_x) (a_x)
		const b = Event.complete_on (a_x) (a)
		const c = Event.switching (b)
		const d = Event.map (() => 1) (a)

		const completion_update_values = []

		Event.calling (x => completion_update_values.push(x)) (Event.completion (c))

		assert.equal(a_x_once.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))
		a.produce(a_x_once)
		a.produce(d)
		assert.equal(a_x_once.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(b.is_complete.perform(), true) // TODO: Sample.get (Event.is_complete (c))
		assert.equal(c.is_complete.perform(), false) // TODO: Sample.get (Event.is_complete (c))

		assert.equal (completion_update_values, [])
	}
)

/*
test.skip('', () => {
	const skip_until = y => x
		switching
			(map
				(() => x)
				(y)
			)

	// TODO: something like this may work, but there may be no need for it.
	// `instant_after` could be implemented using a `post_propagation` style list of functions to "run" a moment of time after another.
	// The idea is applicable to Action as well, which could pass around a propagation object with a list for that purpose.
	const merge_2 = a => b =>
		switch_resolve
			(focused => focusing => focused)
			(a)
			(map
				(() =>
					merge_2
						(b)
						(skip_until (instant_after (b)) (a))
				)
				(b)
			)
})
*/

test.run()
