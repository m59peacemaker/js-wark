import test from 'tape'
import * as Emitter from './Emitter'

test('Emitter.create can emit/listen', t => {
	t.plan(2)

	const emitter = Emitter.create()
	emitter.listen(v => t.equal(v, 123))
	t.equal(t.assertCount, 0)
	emitter.emit(123)
})

test('emitter() can be used to emit', t => {
	t.plan(1)

	const emitter = Emitter.create()
	emitter.listen(v => t.equal(v, 123))
	emitter(123)
})

test('Emitter.map emits with mapped value', t => {
	const expected = [ 4, 9 ]
	t.plan(expected.length)

	const n = Emitter.create()
	const nSquared = Emitter.map (n => n * n) (n)
	nSquared.listen(value => t.equal(value, expected.shift()))
	n.emit(2)
	n.emit(3)
})

test('Emitter.alt makes an emitter that emits when either given emitter emits', t => {
	const expected = [ 'foo', 'bar' ]
	t.plan(expected.length)

	const a = Emitter.create()
	const b = Emitter.create()
	const c = Emitter.alt (a) (b)
	c.listen(value => t.equal(value, expected.shift()))
	b.emit('foo')
	a.emit('bar')
})

test('Emitter.combine makes an emitter that emits when any of the given emitters emit', t => {
	const expected = [ 'foo', 'bar', 'baz', 'qux' ]
	t.plan(expected.length)

	const a = Emitter.create()
	const b = Emitter.create()
	const c = Emitter.create()
	const d = Emitter.combine([ a, b, c ])
	d.listen(value => t.equal(value, expected.shift()))
	b.emit('foo')
	a.emit('bar')
	c.emit('baz')
	a.emit('qux')
})

test('Emitter.filter makes an emitter that emits when then given emitter emits with a value passing the given predicate', t => {
	const expected = [ 'foo', 'bar' ]
	t.plan(expected.length)

	const word = Emitter.create()
	const shortWord = Emitter.filter (v => v.length <= 3) (word)
	shortWord.listen(value => t.equal(value, expected.shift()))
	word.emit('things')
	word.emit('stuff')
	word.emit('foo')
	word.emit('whatever')
	word.emit('bar')
})

test('Emitter.flatten makes an emitter that emits when emitters emited from the given emitter (inner emitters) emit', t => {
	const expected = [ 'foo', 'bar', 'baz', 'qux', 'fooz', 'fooz' ]
	t.plan(expected.length)

	const emitterEmitter = Emitter.create()
	const a = Emitter.create()
	const b = Emitter.create()

	const flattenedEmitter = Emitter.flatten(emitterEmitter)
	flattenedEmitter.listen(value => t.equal(value, expected.shift()))
	emitterEmitter.emit(a)
	a.emit('foo')
	emitterEmitter.emit(b)
	a.emit('bar')
	b.emit('baz')
	a.emit('qux')
	emitterEmitter.emit(a)
	a.emit('fooz')
})

test('Emitter.chain maps and flattens', t => {
	const expected = [ 'foo', 'bar', 'baz', 'qux', 'fooz', 'fooz' ]
	t.plan(expected.length)

	const emitterNameEmitter = Emitter.create()
	const a = Emitter.create()
	const b = Emitter.create()
	const emitters = { a, b }

	const flattenedEmitter = Emitter.chain (name => emitters[name]) (emitterNameEmitter)
	flattenedEmitter.listen(value => t.equal(value, expected.shift()))
	emitterNameEmitter.emit('a')
	a.emit('foo')
	emitterNameEmitter.emit('b')
	a.emit('bar')
	b.emit('baz')
	a.emit('qux')
	emitterNameEmitter.emit('a')
	a.emit('fooz')
})
