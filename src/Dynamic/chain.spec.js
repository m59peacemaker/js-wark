import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Dynamic from './index.js'

const test = suite('Dynamic.chain')

test('switches between two dynamics with non-simultaneous updates', () => {
	const a = Dynamic.create('a')
	const b = Dynamic.create(0)
	const c = Dynamic.create(a)
	const d = Dynamic.chain (x => x) (c)

	// TODO: test initial inner dynamic update
	assert.equal(d.run(), 'a')
	c.updates.produce(b)
	assert.equal(d.run(), 0)
	c.updates.produce(a)
	assert.equal(d.run(), 'a')
	a.updates.produce('b')
	assert.equal(d.run(), 'b')
	c.updates.produce(b)
	assert.equal(d.run(), 0)
	a.updates.produce('x')
	assert.equal(d.run(), 0)
	b.updates.produce(1)
	assert.equal(d.run(), 1)
	b.updates.produce(2)
	assert.equal(d.run(), 2)
	c.updates.produce(a)
	a.updates.produce('c')
	assert.equal(d.run(), 'c')
	b.updates.produce('x')
	assert.equal(d.run(), 'c')
})

test('switches between two dynamics with simultaneous updates by updating to the new inner dynamic value (eager switch)', () => {
	const a = Dynamic.create(0)
	// a.updates.resolve().label = 'a'
	const b = Dynamic.map (x => `${x}b`) (a, 'b')
	const c = Dynamic.map (x => `${x}c`) (a, 'c')
	const d = Dynamic.create(b)
	const e = Dynamic.chain (x => x) (d, 'e')

	assert.equal(e.run(), '0b')
	a.updates.produce(1)
	assert.equal(e.run(), '1b')
	a.updates.produce(2)
	assert.equal(e.run(), '2b')
	d.updates.produce(c)
	assert.equal(e.run(), '2c')
	a.updates.produce(3)
	assert.equal(e.run(), '3c')
	d.updates.produce(b)
	assert.equal(e.run(), '3b')
	a.updates.produce(4)
	assert.equal(e.run(), '4b')
})

test.run()
