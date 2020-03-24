import { test } from 'zora'
import { collectValues } from '../util'
import delay from 'delay'
import * as Event from './'

test('Event.awaitPromiseOrdered', async t => {
	const a = Event.create()
	const b = Event.awaitPromiseOrdered (a)
	const actual = collectValues(b)
	const promises1 = [ [ 50, 1 ], [ 4, 2 ], [ 30, 3 ] ].map(([ ms, v ]) => delay(ms).then(() => v))
	promises1.forEach(a.occur)
	await Promise.all(promises1)
	await delay(100)
	const promises2 = [ [ 30, 4 ], [ 50, 5 ], [ 4, 6 ] ].map(([ ms, v ]) => delay(ms).then(() => v))
	promises2.forEach(a.occur)
	await Promise.all(promises2)
	t.deepEqual(actual(), [ [ 1, 2, 3 ], [ 4 ], [ 5, 6 ] ])
})
