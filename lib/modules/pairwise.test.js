import test from 'tape'
import { Stream } from '../'
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
