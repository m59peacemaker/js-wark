import { test } from 'zora'
import { Event } from '../index.js'
import { add, collectValues } from '../util.js'

test('Event.combineAllWith', t => {
	t.test('combining events that always occur together', t => {
		const a = Event.create()
		const b = Event.map (add(1)) (a)
		const c = Event.map (add(2)) (a)
		const d = Event.combineAllWith (o => ({ occurrences : o })) ([ b, a, c ])
		const actual = collectValues(d)
		a.occur(10)
		t.deepEqual(actual(), [ { occurrences: { 0: 11, 1: 10, 2: 12 } } ])
	})
	t.test('combining events that sometimes occur together', t => {
		const a = Event.create()
		const b = Event.map (add(1)) (a)
		const c = Event.filter (v => v > 9) (a)
		const d = Event.combineAllWith (o => ({ occurrences : o })) ([ b, a, c ])
		const actual = collectValues(d)
		a.occur(9)
		a.occur(10)
		t.deepEqual(actual(), [ { occurrences: { 0: 10, 1: 9 } }, { occurrences: { 0: 11, 1: 10, 2: 10} } ])
	})
	t.test('mapping a combined event of simultaneous events', t => {
		const a = Event.create()
		const b = Event.map (add(1)) (a)
		const c = Event.combineAllWith (o => Object.values(o).reduce((a, b) => a + b, 0)) ([ a, b ])
		const d = Event.map (add(1)) (c)
		const actualC = collectValues(c)
		const actualD = collectValues(d)
		a.occur(1)
		t.equal(actualC(), [ 3 ])
		t.equal(actualD(), [ 4 ])
	})
})
