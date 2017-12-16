import test from 'tape'
import { Stream } from '../'
import { map, bufferCount } from './'

test('bufferCount', t => {
  t.test('emits immediately if source is initialized and `size` is 1', t => {
    const a = Stream(0)
    const b = bufferCount (1) (1) (a)

    t.deepEqual(b.get(), [ 0 ])

    t.end()
  })

  t.test('initially emits on `size` nth value', t => {
    const a = Stream(0)
    const b = bufferCount (3) (1) (a)

    t.false(b.initialized)

    a.set(1)

    t.false(b.initialized)

    a.set(2)

    t.true(b.initialized)

    t.end()
  })

  t.test('starts buffer every `startEvery` emissions when `startEvery` is 1', t => {
    const a = Stream(0)
    const b = bufferCount (1) (1) (a)

    t.deepEqual(b.get(), [ 0 ])

    a.set(1)

    t.deepEqual(b.get(), [ 1 ])

    a.set(2)

    t.deepEqual(b.get(), [ 2 ])

    t.end()
  })

  t.test('starts buffer every `startEvery` emissions when `startEvery` is 2', t => {
    t.plan(3)

    const a = Stream(0)
    const b = bufferCount (1) (2) (a)
    const results = [ [ 0 ], [ 2 ], [ 4 ] ]
    map (result => t.deepEqual(result, results.shift())) (b)

    a.set(1)
    a.set(2)
    a.set(3)
    a.set(4)
    a.set(5)

    t.end()
  })

  t.test('starts buffer every `startEvery` emissions when `startEvery` is 5', t => {
    const a = Stream()
    const b = bufferCount (1) (5) (a)
    const results = [ [ 0 ], [ 5 ], [ 10 ] ]
    map (result => t.deepEqual(result, results.shift())) (b)

    ;[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ].forEach(a.set)

    t.end()
  })

  t.test('size = 1, startEvery = 1', t => {
    const a = Stream()
    const b = bufferCount (1) (1) (a)
    const results = [ [ 0 ], [ 1 ], [ 2 ], [ 3 ] ]
    map (result => t.deepEqual(result, results.shift())) (b)

    ;[ 0, 1, 2, 3 ].forEach(a.set)

    t.end()
  })

  t.test('size = 2, startEvery = 1', t => {
    const a = Stream()
    const b = bufferCount (2) (1) (a)
    const results = [ [ 0, 1 ], [ 1, 2 ], [ 2, 3 ], [ 3, 4 ] ]
    map (result => t.deepEqual(result, results.shift())) (b)

    ;[ 0, 1, 2, 3, 4 ].forEach(a.set)

    t.end()
  })

  t.test('size = 2, startEvery = 3', t => {
    const a = Stream()
    const b = bufferCount (2) (3) (a)
    const results = [ [ 0, 1 ], [ 3, 4 ], [ 6, 7 ], [ 9, 10 ] ]
    map (result => t.deepEqual(result, results.shift())) (b)

    ;[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ].forEach(a.set)

    t.end()
  })

  t.test('size = 3, startEvery = 5', t => {
    const a = Stream()
    const b = bufferCount (3) (5) (a)
    const results = [ [ 0, 1, 2 ], [ 5, 6, 7 ], [ 10, 11, 12 ] ]
    map (result => t.deepEqual(result, results.shift())) (b)

    ;[ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ].forEach(a.set)

    t.end()
  })
})
