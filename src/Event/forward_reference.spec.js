import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event, Reference, immediately, subsequently } from '../index.js'
import { promise_wait } from '../test/util.js'

// TODO: move these tests to `reference` or `misc ?
const test = suite('Event forward reference')

test('has same occurrences as assigned event', () => {
	const values = []
	const a = Reference.create()
	Event.calling (x => values.push(x)) (a)
	const b = Event.exposed_producer()

	a.assign(b)
	b.produce(1)
	b.produce(2)
	b.produce(3)

	assert.equal(values, [ 1, 2, 3 ])
})

test('has same complete occurrence as assigned event', () => {
	const values = []
	const a = Reference.create()
	Event.calling (x => values.push(x)) (Event.complete (a))
	const b = Event.exposed_producer()
	const b_x = Event.exposed_producer()
	const c = Event.take_until (b_x) (b)

	a.assign(c)
	b.produce(1)
	b.produce(2)
	b.produce(3)
	b_x.produce('x')

	assert.equal(values, [ 'x' ])
})

test('has same complete occurrence as assigned event complete', () => {
	const values = []
	const a = Reference.create()
	Event.calling (x => values.push(x)) (Event.complete (Event.complete (a)))
	const b = Event.exposed_producer()
	const b_x = Event.exposed_producer()
	const c = Event.take_until (b_x) (b)

	a.assign(c)
	b.produce(1)
	b.produce(2)
	b.produce(3)
	b_x.produce('x')

	assert.equal(values, [ 'x' ])
})

test('has same complete occurrence as assigned event complete', () => {
	const values = []
	const a = Reference.create()
	Event.calling (x => values.push(x)) (Event.complete (Event.complete (a)))
	const b = Event.exposed_producer()
	const b_x = Event.exposed_producer()
	const c = Event.take_until (b_x) (b)

	a.assign(c)
	b.produce(1)
	b.produce(2)
	b.produce(3)
	b_x.produce('x')

	assert.equal(values, [ 'x' ])
})

test('interval via self referencing switch_with', async () => {
	/*
		initial focused wait occurs
		switch computes with value of initial focused wait and value of focusing event (never)
		switch occurs
		switch changes focus to new wait

		focused wait occurs
		switch computes with value of focused wait and value of focusing event (never)
		switch occurs
		switch changes focus to new wait
	*/
	const interval = ({ ms }) => {
		// TODO: use function closure version
		const interval = Reference.create()
		return interval.assign(
			Event.switch_updating
				(subsequently)
				(Event.wait ({ ms }))
				(Event.map
					(() => Event.wait ({ ms }))
					(interval)
				)
		)
	}

	const values = []
	Event.calling
		(() => values.push(Date.now()))
		(Event.take (3) (interval ({ ms: 100 })))

	await promise_wait (600)

	assert.equal(values.length, 3)
})

/*
	initial (wait) unsettles interval (merge, unsettled by a)
	interval (merge) unsettles rest (switch, unsettled by source event)
	rest (switch) unsettles interval (merge, unsettled by b) - b_is_circular
	TODO: compute/settle rest (merge) here? probably no reason to, but just an idea.

	interval (merge) computes, initial (wait, settled), rest (switch) unsettled, but skipped (b_is_circular)
	rest computes (from source event) source event settled (interval), inner event settled (new wait), obsolete_inner_event settled (never)
	
	rest inner (wait) unsettles rest (switch, unsettled by inner event)
	rest (switch) unsettles interval (merge)
	interval (merge) unsettles rest (switch, unsettled by source_event) source_event_is_circular
	TODO: compute/settle interval (switch) here? probably no reason to, but just an idea.
	TODO: the inner event triggers the source_event pre_compute... could state `inner_event_unsettling` be relevant?

	rest (switch) computes, already settled, or settles because source_event (interval) is circular and inner event (wait) is settled
	interval computes, initial (wait) settled, rest (switch) settled
*/
test('interval via self referencing switch and merge', async () => {
	const interval = ({ ms }) => {
		/*
			initial wait occurs
			interval computes with { initial_wait: value, rest: nothing }
			interval occurs with initial wait value
			rest changes focus to a new wait

			rest focused wait occurs
			rest computes with { focused: focused_wait, focusing: none }
			interval computes with { initial_wait: nothing, rest: focused_wait }
			interval occurs
			rest changes focus to a new wait
		*/
		// an interval is self referencing - its a series of starting a wait when its wait is finished
		const interval = Reference.create()

		// need an initial one to kick things off
		const initial = Event.wait ({ ms })

		// the rest of the occurrences are from starting a wait when the interval occurs (there's the self reference)
		// const rest = Event.switch
		// 	(() => Event.wait ({ ms }))
		// 	(interval)

		const rest = Event.switch_updating
			(subsequently)
			(Event.never)
			(Event.map
				(() => Event.wait ({ ms }))
				(interval)
			)

		// the interval is the initial wait as well as the rest of them
		return interval.assign(
			Event.alt
				(initial)
				(rest)
		)
	}



	/*
		merge_2_with_pre_compute:
			settled = true
			unsettling = false
		switch.source_event_observer.pre_compute:
			settled = true
			unsettling = false

		initial:
			calls merge_2_with dependency_observer.pre_compute (self, false)
		merge_2_with.dependency_observer.pre_compute(a, false):
			settled = false
			unsettling = true
			calls switch source_event_observer.pre_compute (self, false)
		switch.source_event_observer.pre_compute(source_event, false):
			settled = false
			unsettling = true
			calls merge_2_with.dependency_observer.pre_compute (self, true)
		merge_2_with.dependency_observer.pre_compute(b, true):
			b_is_circular = true
			// calls switch.inner_event_observer.pre_compute(source_event, true)

			
		merge_2_with_pre_compute:
			unsettling = false

		

		merge_2_with calls switch source_event_observer.pre_compute(source_event, )
	*/

	const values = []
	Event.calling
		(() => values.push(Date.now()))
		(Event.take (3) (interval ({ ms: 100 })))
		// (interval ({ ms: 100 }))

	await promise_wait(600)

	assert.equal(values.length, 3)

	/*
		`initial` is `wait`
		`interval` is `alt`
		`rest` is `switch`

		the `initial` wait is finished, so `initial` propagates:
			`initial` unsettles `interval`
				`interval` unsettles `rest`
					`rest` unsettles `interval`
				`interval` sees that while is was unsettling dependants, it was unsettled by `rest`, one of its dependencies, so it will not wait for `rest` to settle this time.
			`interval` computes:
				`initial` is settled and `rest` is ignored, so `interval` settles and propagates:
					`rest` switches to a new `wait`, its obsolete inner event (never) is settled and not occurring, and its new inner event is settled and not occurring,
						so it settles without occurring
						
		the next `wait` in `rest` is finished, so `rest` propagates:
			`rest` unsettles `interval`
				`interval` unsettles `rest`
			`rest` sees that while is was unsettling dependants, it was unsettled. It only unsettles due to `interval`, so it knows not to wait for `interval` to settle.
			`interval` computes:
				`initial` is settled and `rest` is settled, so `interval` settles propagates:
					`rest` already computed, so it does nothing
	
	*/
})

/*
	initial_wait (wait) unsettles new_waits (merge)
	new_waits (merge) unsettles waits_done (switch, unsettled by source event)
	waits_done (switch) unsettles new_waits (merge) - b_is_circular

	new_waits (merge) computes, initial_wait settled, waits_done (b) is circular
	waits_done (switch) computes

	waits_done inner (wait) unsettles waits_done (switch, unsettled by inner event)
	waits_done (switch) unsettles new_waits (merge)
	new_waits (merge) unsettles waits_done (switch, unsettled by source_event)
	TODO: !!! The rule may be that cycles are permissible as long as the dependency involved is not the same:
		switch inner_event pre_compute leads to its source_event pre_compute
		switch source_event pre_compute leads to its inner_event pre_compute TODO: verify/test this is rational
		merge a pre_compute leads to its b pre_compute (or vice versa)
*/
test('interval after initial wait via self referencing merge and switch', async () => {
	const values = []

	const ms = 100

	const initial_wait = Event.wait ({ ms })

	const waits_done = Reference.create()

	const new_waits = Event.alt
		(initial_wait)
		(waits_done)

	waits_done.assign(
		Event.switch_updating
			(subsequently)
			(Event.never)
			(Event.map
				(() => Event.wait ({ ms }))
				(new_waits)
			)
	)

	Event.calling (() => values.push(Date.now())) (Event.take (3) (waits_done))

	await promise_wait(600)

	assert.equal(values.length, 3)

	// Event.calling (() => console.log(values)) (Event.complete (Event.take (3) (waits_done)))

	// setInterval(() => {
	// 	console.log({
	// 		initial_wait: { size: initial_wait.observers.size, complete: initial_wait.complete.time },
	// 		waits_done: { size: waits_done.observers.size, complete: waits_done.complete.time },
	// 		new_waits: { size: new_waits.observers.size, complete: new_waits.complete.time }
	// 	})
	// }, 50)

	/*
		the `initial_wait` is finished, so `initial_wait` propagates:
			`initial_wait` unsettles `new_waits`
				`new_waits` unsettles `waits_done`
					`waits_done` unsettles `new_waits`
				`new_waits` sees that while is was unsettling dependants, it was unsettled by `waits_done`, one of its dependencies, so it will not wait for `waits_done` to settle this time.
			`new waits` computes:
				`initial_wait` is settled and `waits_done` is ignored, so `new_waits` settles and propagates:
					`waits_done` switches to a new `wait`, its obsolete inner event (never) is settled and not occurring, and its new inner event is settled and not occurring,
						so it settles without occurring

		the next `wait` in `waits_done` is finished, so it propagates to inner_source_event observer in `waits_done`
			`waits_done` unsettles `new_waits`
				`new_waits` unsettles `waits_done`
			`waits_done` sees that while is was unsettling dependants, it was unsettled. It only unsettles due to `new_waits`, so it knows not to wait for `new_waits` to settle.
			`waits_done` inner_source_event observer computes:
				the source event, `new_waits` is ignored, and the obsolete inner event (old wait) and inner event (new wait) are settled,
				and the inner event is occurring, so `waits_done` settles and occurs
				`new_waits` computes:
					initial_wait is settled, `waits_done` is settled and occurring,
					so `new_waits` settles and occurs
				`waits_done` source_event_observer computes:
					switches to a new wait
	*/
})

test.run()
