import { test } from 'zora'
import { Dynamic, Event } from '../index.js'

test('Dynamic.toggle', t => {
	const a = Event.create()
	const b = Dynamic.toggle (false) (a)
	t.equal(b.sample(), false)
	a.occur()
	t.equal(b.sample(), true)
	a.occur()
	t.equal(b.sample(), false)
	a.occur()
	t.equal(b.sample(), true)
	a.occur()
	t.equal(b.sample(), false)
})
