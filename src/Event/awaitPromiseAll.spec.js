import { test } from 'zora'
import * as Event from './'
import { collectValues } from '../util'

// TODO: replace this
const promiseNext = event => new Promise(event.subscribe)

test('Event.awaitPromiseAll', async t => {
	const a = Event.create()
	const b = Event.awaitPromiseAll (a)
	const actual = collectValues(b)
	const promises1 = [ [ 50, 1 ], [ 4, 2 ], [ 30, 3 ] ].map(([ ms, v ]) => new Promise(resolve => setTimeout(() => resolve(v), ms)))
	promises1.forEach(a.occur)
	await promiseNext(b)
	const promises2 = [ [ 30, 4 ], [ 50, 5 ], [ 4, 6 ] ].map(([ ms, v ]) => new Promise(resolve => setTimeout(() => resolve(v), ms)))
	promises2.forEach(a.occur)
	await promiseNext(b)
	t.deepEqual(actual(), [ [ 1, 2, 3 ], [ 4, 5, 6 ] ])
})
