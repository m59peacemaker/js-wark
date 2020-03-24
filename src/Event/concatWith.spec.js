import { test } from 'zora'
import * as Event from './'
import { collectValues, identity } from '../util'

test('Event.concatWith', t => {
	t.test('whenA, whenB', t => {
		const a = Event.create()
		const b = Event.create()
		const c = Event.concatWith (a => a + a) (b => b + b) (t.fail) (a) (b)
		const actual = collectValues(c)
		b.occur('b')
		b.occur('b')
		a.occur('a')
		b.occur('b')
		a.occur('a')
		t.deepEqual(actual(), [ 'bb', 'bb', 'aa', 'bb', 'aa' ])
	})
	t.test('whenAB', t => {
		const a = Event.create()
		const b = Event.filter (v => v % 2 === 0) (a)
		const c = Event.concatWith (identity) (t.fail) (a => b => [ a, b ]) (a) (b)
		const actual = collectValues(c)
		a.occur(0)
		a.occur(5)
		a.occur(10)
		a.occur(15)
		t.deepEqual(actual(), [ [ 0, 0 ], 5, [ 10, 10 ], 15 ])
	})
})
