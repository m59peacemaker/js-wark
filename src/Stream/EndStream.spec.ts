import test from 'zora'
import EndStream from './EndStream'

test('EndStream', t => {
	t.test('value is initially false', t => {
		t.equal(EndStream().get(), false)
	})
	t.test('value is always set to true with endStream.set(arg)', t => {
		const endStream = EndStream()
		endStream.set(123)
		t.equal(endStream.get(), true)
	})
	t.test('value is always set to true with endStream.set()', t => {
		const endStream = EndStream()
		endStream.set()
		t.equal(endStream.get(), true)
	})
	t.test('value is always set to true with endStream(arg)', t => {
		const endStream = EndStream()
		endStream(123)
		t.equal(endStream.get(), true)
	})
	t.test('value is always set to true with endStream()', t => {
		const endStream = EndStream()
		endStream()
		t.equal(endStream.get(), true)
	})
	t.test('endStream.end is a self reference', t => {
		const endStream = EndStream()
		t.ok(Object.is(endStream, endStream.end))
	})
	t.test('throws if set after ended', t => {
		const endStream = EndStream()
		endStream()
		t.throws(endStream.set)
	})
	t.test('toStringTag', t => {
		const endStream = EndStream()
		t.equal(Object.prototype.toString.call(endStream), '[object WarkEndStream]')
	})
	t.test('toString', t => {
		const endStream = EndStream()
		t.equal(endStream.toString(), 'WarkEndStream(false)')
	})
	t.test('toJSON', t => {
		const endStream = EndStream()
		t.equal(JSON.stringify({ foo: endStream }), `{"foo":false}`)
	})
})
