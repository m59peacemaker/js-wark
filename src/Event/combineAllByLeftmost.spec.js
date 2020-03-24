import { test } from 'zora'
import * as Event from './'
import { add, collectValues } from '../util'

test('Event.combineAllByLeftmost', t => {
	t.test('concatting events that never occur together occurs with the value of each event occurrence', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.combineAllByLeftmost([ a, b ])
		const actual = collectValues(c)
		b.occur(10)
		a.occur(20)
		a.occur(30)
		b.occur(40)
		t.deepEqual(actual(), [ 10, 20, 30, 40 ])
	})
	t.test('concatting events that sometimes occur together always occurs with the value of the first given event', t => {
		const a = Event.create()
		const b = Event.filter (v => v < 10 || (v !== 10 && v % 2 === 0)) (a)
		const c = Event.filter (v => v > 10 || (v !== 10 && v % 2 === 0)) (a)
		const d = Event.combineAllByLeftmost([ b, c ])
		const actual = collectValues(d)
		a.occur(9)  // b, < 10
		a.occur(10)
		a.occur(11) // c, > 10
		a.occur(12) // b, c % 2 === 0
		a.occur(13) // c > 10
		t.deepEqual(actual(), [ 9, 11, 12, 13 ])
	})
	t.test('concatting events that always occur together always occurs the value of the first given event', t => {
		const a = Event.create()
		const b = Event.map (add(1)) (a)
		const c = Event.combineAllByLeftmost([ a, b ])
		const actual = collectValues(c)
		a.occur(20)
		a.occur(30)
		t.deepEqual(actual(), [ 20, 30 ])
	})
})
