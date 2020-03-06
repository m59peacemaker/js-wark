import { test } from 'zora'
import { Time } from './'

test('Time', t => {
	const time = Time()
	t.equal(time.current(), 0)
	t.equal(time.forward(), 1)
	t.equal(time.current(), 1)
	t.equal(time.forward(), 2)
	t.equal(time.current(), 2)
})
