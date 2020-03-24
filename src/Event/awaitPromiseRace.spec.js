import { test } from 'zora'
import * as Event from './'
import { collectValues } from '../util'

test('Event.awaitPromiseRace', async t => {
	const a = Event.create()
	const b = Event.awaitPromiseRace (a)
	const actual = collectValues(b)
	const race1 = [ [ 50, 'x' ], [ 4, 1 ], [ 30, 'xx' ] ].map(([ ms, v ]) => new Promise(resolve => setTimeout(() => resolve(v), ms)))
	race1.forEach(a.occur)
	await Promise.all(race1)
	const race2 = [ [ 30, 'y' ], [ 50, 'yy' ], [ 4, 2 ] ].map(([ ms, v ]) => new Promise(resolve => setTimeout(() => resolve(v), ms)))
	race2.forEach(a.occur)
	await Promise.all(race2)
	t.deepEqual(actual(), [ 1, 2 ])
})
