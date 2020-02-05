import test from 'tape'
import * as Emitter from '../Emitter'
import * as Dynamic from './'

test('Dynamic.fromEmitter dynamic has initial value', t => {
	const e = Emitter.create()
	const o = Dynamic.fromEmitter ('foo') (e)
	t.equal(o.get(), 'foo')
	t.end()
})

test('Dynamic.fromEmitter dynamic gets new value from emitter', t => {
	const e = Emitter.create()
	const o = Dynamic.fromEmitter ('foo') (e)
	t.equal(o.get(), 'foo')
	e.emit('bar')
	t.equal(o.get(), 'bar')
	e.emit('baz')
	t.equal(o.get(), 'baz')
	t.end()
})

test('Dynamic.fromEmitter dynamic observer gets dynamic values', t => {
	const expected = [ 'foo', 'bar', 'baz' ]
	t.plan(expected.length)

	const e = Emitter.create()
	const o = Dynamic.fromEmitter ('foo') (e)
	o.observe(value => t.equal(value, expected.shift()))
	e.emit('bar')
	e.emit('baz')
})
