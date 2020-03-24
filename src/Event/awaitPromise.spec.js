import { test } from 'zora'
import * as Event from './'
import { collectValues } from '../util'

// TODO: replace this
const promiseNext = event => new Promise(event.subscribe)

// occurs with the value of each promise, when each promise resolves (occurs in order of resolution, not order received)
test('Event.awaitPromise', async t => {
	const a = Event.create()
	const b = Event.awaitPromise(a)
	const actual = collectValues(b)
	a.occur(new Promise(resolve => setTimeout(() => resolve(1), 50)))
	a.occur(new Promise(resolve => setTimeout(() => resolve(2), 4)))
	await promiseNext(b)
	await promiseNext(b)
	a.occur(new Promise(resolve => setTimeout(() => resolve(3), 4)))
	a.occur(new Promise(resolve => setTimeout(() => resolve(4), 50)))
	await promiseNext(b)
	await promiseNext(b)
	t.deepEqual(actual(), [ 2, 1, 3, 4 ])
})

