import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Event } from '../index.js'

const test = suite('Event.from_promise')

test('occurs with resolve value of promise', async () => {
	const values = []
	const promise = new Promise(resolve => resolve ('resolve'))
	Event.calling
		(x => values.push(x))
		(Event.from_promise (promise))
	await promise
	assert.equal(values, [ 'resolve' ])
})

test('occurs with reject value of promise', async () => {
	const values = []
	const promise = new Promise((_, reject) => reject ('reject'))
	Event.calling
		(x => values.push(x))
		(Event.from_promise (promise))
	await promise.catch(() => {})
	assert.equal(values, [ 'reject' ])
})

test('completes when promise resolves', async () => {
	const values = []
	const promise = new Promise(resolve => resolve('resolve'))
	Event.calling
		(x => values.push(x))
		(Event.complete (Event.from_promise (promise)))
	await promise
	assert.equal(values, [ 'resolve' ])
})

test('completes when promise rejects', async () => {
	const values = []
	const promise = new Promise((_, reject) => reject('reject'))
	Event.calling
		(x => values.push(x))
		(Event.complete (Event.from_promise (promise)))
	await promise.catch(() => {})
	assert.equal(values, [ 'reject' ])
})

test.run()
