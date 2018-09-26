import test from 'tape'
import { Stream, isStream, immediate } from '../../'
import { combineCollection } from '../'

test('combineCollection', t => {
  t.test('emits once all values that are streams are initialized', t => {
    const collection = {
      a: Stream(),
      b: Stream()
    }
    const combined = combineCollection(collection)

    t.false(combined.initialized)
    t.equal(combined.get(), undefined)

    collection.a.set(1)

    t.false(combined.initialized)
    t.equal(combined.get(), undefined)

    collection.b.set(2)

    t.true(combined.initialized)

    t.end()
  })

  t.test(
    'combines values that are streams into one stream that emits an collection of regular values',
    t => {
      const collection = {
        a: Stream(1),
        b: Stream(2)
      }
      const combined = combineCollection(collection)

      t.deepEqual(combined.get(), { a: 1, b: 2 })

      t.end()
    }
  )

  t.test('keeps entries that have regular values', t => {
    const collection = {
      a: Stream(1),
      b: 2,
      c: Stream(3)
    }
    const combined = combineCollection(collection)

    t.deepEqual(combined.get(), { a: 1, b: 2, c: 3 })

    collection.c.set(33)

    t.deepEqual(combined.get(), { a: 1, b: 2, c: 33 })

    t.end()
  })

  t.test('combines arrays', t => {
    const collection = [ 'a', Stream('b'), 'c' ]
    const combined = combineCollection(collection)

    t.true(Array.isArray(combined.get()))
    t.deepEqual(combined.get(), [ 'a', 'b', 'c' ])

    collection[1].set('bb')

    t.true(Array.isArray(combined.get()))
    t.deepEqual(combined.get(), [ 'a', 'bb', 'c' ])

    t.end()
  })

  t.test('empty object emits empty object', t => {
    const combined = combineCollection({})

    t.true(combined.initialized)
    t.deepEqual(combined.get(), {})

    t.end()
  })

  t.test('empty array emits empty array', t => {
    const combined = combineCollection([])

    t.true(combined.initialized)
    t.deepEqual(combined.get(), [])
    t.true(Array.isArray(combined.get()))

    t.end()
  })

  t.test('immediate', t => {
    const collection = {
      a: Stream(1),
      b: 2,
      c: Stream()
    }
    const combined = combineCollection(collection)

    t.false(combined.initialized)

    immediate(combined)

    t.true(combined.initialized)
    t.deepEqual(combined.get(), { a: 1, b: 2, c: undefined })

    t.end()
  })

  t.test('ends when any stream ends', t => {
    const collection = {
      a: Stream(),
      b: Stream()
    }
    const combined = combineCollection(collection)

    t.false(combined.end.get())

    collection.a.end()

    t.true(combined.end.get())

    t.end()
  })
})
