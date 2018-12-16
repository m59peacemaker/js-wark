import test from 'tape'
import * as State from './State'

const add = a => b => a + b
const increment = add (1)

test('State', t => {
	t.test('of(value) returns state with given value', t => {
		const state = State.of(123)
		t.equal(state.get(), 123)
		t.end()
	})

	t.test('map (fn) (state) returns new state with mapped value', t => {
		const state = State.of(123)
		const mappedState = State.map (increment) (state)
		t.equal(state.get(), 124)
		t.end()
	})

	t.test(`state.set(value) updates the state's value`, t => {
		const state = State.of(123)
		t.equal(state.get(), 123)
		state.set(124)
		t.equal(state.get(), 124)
		t.end()
	})

	t.test(`mapped state's value has changed if its dependency has changed`, t => {
		const state = State.of(123)
		const mappedState = State.map (increment) (state)
		t.equal(mappedState.get(), 124)
		state.set(4)
		t.equal(mappedState.get(), 5)
		t.end()
	})

	t.test('lift (sum) (states) returns a state whose value is the result of calling the given function with the given states', t => {
		const a = State.of(1)
		const b = State.of(2)
		const abSum = State.lift (sum) ([ a, b ])
		t.equal(abSum.get(), 3)
		t.end()
	})

	t.test(`lift state's value has changed if any dependencies have changed`, t => {
		const a = State.of(1)
		const b = State.of(2)
		const abSum = State.lift (sum) ([ a, b ])
		t.equal(abSum.get(), 3)
		b.set(9)
		t.equal(abSum.get(), 10)
		b.set(4)
		t.equal(abSum.get(), 5)
		a.set(2)
		t.equal(abSum.get(), 6)
		b.set(7)
		t.equal(abSum.get(), 9)
		t.end()
	})

	t.test('forking dependency, dirty reads or something', t => {
		const a = State.of(123)
		const b = State.map (inc) (a)
		const c = State.map (inc) (a)
		const d = State.lift (sum) ([ b, c ])
		t.end()
	})
})
