import { test } from 'zora'
import * as Event from '../Event'
import * as Dynamic from './'

test('Dynamic.onOff', t => {
	const on = Event.create()
	const off = Event.create()
	const onOff = Dynamic.onOff (false) (on) (off)
	t.equal(onOff.sample(), false)
	off()
	t.equal(onOff.sample(), false)
	on()
	t.equal(onOff.sample(), true)
	on()
	t.equal(onOff.sample(), true)
	off()
	t.equal(onOff.sample(), false)
	on()
	t.equal(onOff.sample(), true)
})
