import test from 'tape'
import { Stream } from '../'
import { map, keepWhen } from './'

test('keepWhen', t => {
  t.test('emits values from source when test stream has a truthy value', t => {
    const testStream = Stream(true)
    const sourceStream = Stream(123)
    const kept = keepWhen (testStream) (sourceStream)

    t.equal(kept.get(), 123)

    testStream.set('hey')
    sourceStream.set(456)

    t.equal(kept.get(), 456)

    testStream.set(1)
    sourceStream.set(789)

    t.equal(kept.get(), 789)

    t.end()
  })

  t.test('does not emit values from source when test stream has a falsey value', t => {
    const testStream = Stream(false)
    const sourceStream = Stream(123)
    const kept = keepWhen (testStream) (sourceStream)

    t.equal(kept.get(), undefined)

    testStream.set(0)
    sourceStream.set(456)

    t.equal(kept.get(), undefined)

    testStream.set(null)
    sourceStream.set(789)

    t.equal(kept.get(), undefined)

    t.end()
  })

  t.test('does not emit until source is initialized', t => {
    const testStream = Stream(true)
    const sourceStream = Stream()
    const kept = keepWhen (testStream) (sourceStream)
    let count = 0
    map (() => ++count) (kept)

    t.equal(count, 0)

    testStream.set(123)

    t.equal(count, 0)

    sourceStream.set('hey')

    t.equal(count, 1)

    t.end()
  })

  t.test(
    'does not emit when test stream changes',
    t => {
      const testStream = Stream()
      const sourceStream = Stream()
      const kept = keepWhen (testStream) (sourceStream)

      sourceStream.set(123)
      testStream.set(true)

      t.equal(kept.get(), undefined)

      t.end()
    }
  )

  t.test('ends when source ends', t => {
    const testStream = Stream(true)
    const sourceStream = Stream()
    const kept = keepWhen (testStream) (sourceStream)
    sourceStream.end()

    t.true(kept.end.get())

    t.end()
  })

  t.test('does not end when test stream ends', t => {
    const testStream = Stream(true)
    const sourceStream = Stream()
    const kept = keepWhen (testStream) (sourceStream)
    testStream.end()

    t.false(kept.end.get())

    t.end()
  })

  t.test(
    'uses last (current) value of test stream if test stream is ended, but source is not ended',
    t => {
      const testStream = Stream()
      const sourceStream = Stream()
      const kept = keepWhen (testStream) (sourceStream)

      testStream.set(true)

      sourceStream.set(123)

      t.equal(kept.get(), 123)

      testStream.set(false)

      sourceStream.set(456)

      t.equal(kept.get(), 123)

      testStream.set(true)
      testStream.end()
      sourceStream.set(456)

      t.equal(kept.get(), 456)

      sourceStream.set(789)

      t.equal(kept.get(), 789)

      t.end()
    }
  )
})
