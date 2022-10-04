import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { Dynamic, Event, Reference, Sample } from '../index.js'

const test = suite('Dynamic.chain')

test('switches between two dynamics with non-simultaneous updates', () => {
	const a = Dynamic.create('a')
	const b = Dynamic.create(0)
	const c = Dynamic.create(a)
	const d = Dynamic.chain (x => x) (c)

	assert.equal(Dynamic.get(d), 'a')
	a.updates.produce('aa')
	assert.equal(Dynamic.get(d), 'aa')
	a.updates.produce('a')
	assert.equal(Dynamic.get(d), 'a')
	c.updates.produce(b)
	assert.equal(Dynamic.get(d), 0)
	c.updates.produce(a)
	assert.equal(Dynamic.get(d), 'a')
	a.updates.produce('b')
	assert.equal(Dynamic.get(d), 'b')
	c.updates.produce(b)
	assert.equal(Dynamic.get(d), 0)
	a.updates.produce('x')
	assert.equal(Dynamic.get(d), 0)
	b.updates.produce(1)
	assert.equal(Dynamic.get(d), 1)
	b.updates.produce(2)
	assert.equal(Dynamic.get(d), 2)
	c.updates.produce(a)
	a.updates.produce('c')
	assert.equal(Dynamic.get(d), 'c')
	b.updates.produce('x')
	assert.equal(Dynamic.get(d), 'c')
})

test('switches between two dynamics with simultaneous updates by updating to the new inner dynamic value (eager switch)', () => {
	const a = Dynamic.create(0)
	const b = Dynamic.map (x => `${x}b`) (a, 'b')
	const c = Dynamic.map (x => `${x}c`) (a, 'c')
	const d = Dynamic.create(b)
	const e = Dynamic.chain (x => x) (d, 'e')

	assert.equal(Dynamic.get(e), '0b')
	a.updates.produce(1)
	assert.equal(Dynamic.get(e), '1b')
	a.updates.produce(2)
	assert.equal(Dynamic.get(e), '2b')
	d.updates.produce(c)
	assert.equal(Dynamic.get(e), '2c')
	a.updates.produce(3)
	assert.equal(Dynamic.get(e), '3c')
	d.updates.produce(b)
	assert.equal(Dynamic.get(e), '3b')
	a.updates.produce(4)
	assert.equal(Dynamic.get(e), '4b')
})

test('', () => {
	const values = []
	let n = 0
	const sample_n = Sample.construct (() => ++n)
	const a = Reference.create()
	const b = Event.hold (n) (Event.tag (sample_n) (a))
	const c = Dynamic.create('foo')
	const d = Event.hold (b) (a)
	const e = Dynamic.join (d)
	Dynamic.calling
		(x => values.push(x))
		(e)

	// TODO: specific error
	assert.throws(() => Dynamic.get(e), error => error instanceof Error)

	const z = a.assign(Event.exposed_producer())

	assert.equal(values, [ 0 ])

	assert.equal(Dynamic.get(e), 0)

	z.produce(b)
	assert.equal(Dynamic.get(e), 0)
	assert.equal(values, [ 0, 0 ])

	z.produce(c)
	assert.equal(Dynamic.get(e), 'foo')
	assert.equal(values, [ 0, 0, 'foo' ])
})

test.run()
