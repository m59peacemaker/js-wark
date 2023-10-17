import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import * as Variable from './index.js'

const test = suite('Variable.join')

test('switches between two dynamics with non-simultaneous updates', () => {
	const a = Variable.create('a')
	const b = Variable.create(0)
	const c = Variable.create(a)
	const [ d ] = Variable.join(c)

	// TODO: test initial inner dynamic update

	assert.equal(d.perform(), 'a')

	c.updates.produce(b)
	assert.equal(d.perform(), 0)

	c.updates.produce(a)
	assert.equal(d.perform(), 'a')

	a.updates.produce('b')
	assert.equal(d.perform(), 'b')

	c.updates.produce(b)
	assert.equal(d.perform(), 0)

	a.updates.produce('x')
	assert.equal(d.perform(), 0)

	b.updates.produce(1)
	assert.equal(d.perform(), 1)
	b.updates.produce(2)
	assert.equal(d.perform(), 2)
	c.updates.produce(a)
	a.updates.produce('c')
	assert.equal(d.perform(), 'c')
	b.updates.produce('x')
	assert.equal(d.perform(), 'c')
})

test('switches between two dynamics with simultaneous updates by updating to the new inner dynamic value (eager switch)', () => {
	const a = Variable.create(0)
	const [ b ] = Variable.map (x => `${x}b`) (a)
	const [ c ] = Variable.map (x => `${x}c`) (a)
	const d = Variable.create(b)
	const [ e ] = Variable.join(d)

	assert.equal(e.perform(), '0b')
	a.updates.produce(1)
	assert.equal(e.perform(), '1b')
	a.updates.produce(2)
	assert.equal(e.perform(), '2b')
	d.updates.produce(c)
	assert.equal(e.perform(), '2c')
	a.updates.produce(3)
	assert.equal(e.perform(), '3c')
	d.updates.produce(b)
	assert.equal(e.perform(), '3b')
	a.updates.produce(4)
	assert.equal(e.perform(), '4b')
})

test.run()
