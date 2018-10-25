import test from 'tape'
import { Stream } from '../../'
import { map, buffer } from '../'

test('buffer', t => {
  t.test('does not emit when source emits', t => {
    const source = Stream(1)
    const notifier = Stream()
    const buffered = buffer (notifier) (source)
    let count = 0
    map (() => ++count) (buffered)
    source.set(10)
    source.set(true)
    source.set('')

    t.equal(count, 0)

    t.end()
  })

  t.test('emits when notifier emits', t => {
    const source = Stream()
    const notifier = Stream()
    const buffered = buffer (notifier) (source)
    let count = 0
    map (() => ++count) (buffered)
    notifier.set()

    t.equal(count, 1)

    t.end()
  })

  t.test('emits with buffered values from source since last notifier emit', t => {
    const source = Stream(1)
    const notifier = Stream()
    const buffered = buffer (notifier) (source)
    let count = 0
    map (() => ++count) (buffered)
    source.set(2)
    source.set(3)
    notifier.set()

    t.deepEqual(buffered.get(), [ 1, 2, 3 ])

    notifier.set()

    t.deepEqual(buffered.get(), [])

    source.set(4)
    source.set(5)
    notifier.set()

    t.deepEqual(buffered.get(), [ 4, 5 ])

    t.equal(count, 3)

    t.end()
  })

  t.test('ends when notifierStream ends', t => {
    const source = Stream()
    const notifier = Stream()
    const buffered = buffer (notifier) (source)

    notifier.end()

    t.true(buffered.end.get())

    t.end()
  })

  t.test('does not end when source ends', t => {
    const source = Stream(1)
    const notifier = Stream()
    const buffered = buffer (notifier) (source)
    source.set(2)
    source.end()

    t.false(buffered.end.get())

    notifier.set()

    t.deepEqual(buffered.get(), [ 1, 2 ])

    notifier.set()

    t.deepEqual(buffered.get(), [])

    notifier.set()

    t.deepEqual(buffered.get(), [])

    notifier.end()

    t.true(buffered.end.get())

    t.deepEqual(buffered.get(), [])

    t.end()
  })
})
