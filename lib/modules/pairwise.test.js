import test from 'tape'
import { Stream, immediate } from '../'
import { pairwise } from './'

test('pairwise', t => {
  t.test('emits once there are two values', t => {
    const a = Stream()
    const pair = pairwise(a)

    t.equal(pair.get(), undefined)

    a.set(0)

    t.equal(pair.get(), undefined)

    a.set(1)

    t.notEqual(pair.get(), undefined)

    t.end()
  })

  t.test('emits array containing last value and current value of source', t => {
    const a = Stream()
    const pair = pairwise(a)

    t.equal(pair.get(), undefined)

    a.set(0)

    t.equal(pair.get(), undefined)

    a.set(1)

    t.deepEqual(pair.get(), [ 0, 1 ])

    a.set('french fry')

    t.deepEqual(pair.get(), [ 1, 'french fry' ])

    t.end()
  })

  t.test('can immediately emit when source is not initialized', t => {
    const a = Stream()
    const b = immediate(pairwise(a))

    t.deepEqual(b.get(), [ undefined, undefined ])

    a.set(123)

    t.deepEqual(b.get(), [ undefined, 123 ])

    a.set(456)

    t.deepEqual(b.get(), [ 123, 456 ])

    t.end()
  })

  t.test('can immediately emit when source is initialized', t => {
    const a = Stream(123)
    const b = immediate(pairwise(a))

    t.deepEqual(b.get(), [ undefined, 123 ])

    a.set(456)

    t.deepEqual(b.get(), [ 123, 456 ])

    t.end()
  })

  t.test('ends when source stream ends', t => {
    const a = Stream()
    const pair = pairwise(a)
    a.set(1)
    a.end()
    t.equal(pair.get(), undefined)
    t.true(pair.end.get())

    t.end()
  })
})
