import test from 'tape'
import { Stream, isStream, immediate } from '../'
import { combineObject } from './'

test('combineObject', t => {
  t.test('emits once all values that are streams are initialized', t => {
    const object = {
      a: Stream(),
      b: Stream()
    }
    const combined = combineObject(object)

    t.false(combined.initialized)
    t.equal(combined.get(), undefined)

    object.a.set(1)

    t.false(combined.initialized)
    t.equal(combined.get(), undefined)

    object.b.set(2)

    t.true(combined.initialized)

    t.end()
  })

  t.test(
    'combines values that are streams into one stream that emits an object of regular values',
    t => {
      const object = {
        a: Stream(1),
        b: Stream(2)
      }
      const combined = combineObject(object)

      t.deepEqual(combined.get(), { a: 1, b: 2 })

      t.end()
    }
  )

  t.test('keeps entries that have regular values', t => {
    const object = {
      a: Stream(1),
      b: 2,
      c: Stream(3)
    }
    const combined = combineObject(object)

    t.deepEqual(combined.get(), { a: 1, b: 2, c: 3 })

    object.c(33)

    t.deepEqual(combined.get(), { a: 1, b: 2, c: 33 })

    t.end()
  })



  t.test('immediate', t => {
    const object = {
      a: Stream(1),
      b: 2,
      c: Stream()
    }
    const combined = combineObject(object)

    t.false(combined.initialized)

    immediate(combined)

    t.true(combined.initialized)
    t.deepEqual(combined.get(), { a: 1, b: 2, c: undefined })

    t.end()
  })

  t.test('ends when any stream ends', t => {
    const object = {
      a: Stream(),
      b: Stream()
    }
    const combined = combineObject(object)

    t.false(combined.end.get())

    object.a.end()

    t.true(combined.end.get())

    t.end()
  })
})
