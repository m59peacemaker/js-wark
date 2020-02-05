import test from 'tape'
import * as Mutex from './Mutex'

test('queues acquires until previous acquires release', t => {
	const mutex = Mutex.create()
	const expected = [ 1, 2, 3, 4 ]
	const result : number[] = []
	mutex.acquire(release => {
		mutex.acquire(release => {
			mutex.acquire(release => {
				result.push(4)
				release()
			})
			result.push(2)
			release()
		})
		mutex.acquire(release => {
			result.push(3)
			release()
		})
		result.push(1)
		release()
	})

	t.deepEqual(result, expected)
	t.end()
})

test('multiple release() calls do nothing', t => {
	const mutex = Mutex.create()
	const expected = [ 1, 2, 3, 4 ]
	const result : number[] = []
	mutex.acquire(release => {
		mutex.acquire(release => {
			mutex.acquire(release => {
				result.push(4)
				release()
			})
			result.push(2)
			release()
		})
		mutex.acquire(release => {
			result.push(3)
			release()
			release()
			release()
		})
		result.push(1)
		release()
		release()
	})

	t.deepEqual(result, expected)
	t.end()
})

test('mutex.locked is a boolean of locked state', t => {
	const mutex = Mutex.create()

	t.false(mutex.locked)

	mutex.acquire(release => {
		t.true(mutex.locked)
		release()
		t.false(mutex.locked)
	})

	t.end()
})
