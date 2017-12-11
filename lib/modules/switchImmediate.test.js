import test from 'tape'
import { Stream } from '../'
import { switchImmediate } from './'

test('switchImmediate', t => {
  t.test('immediately emits with the current value of the inner stream', t => {
    const a = Stream(1)
    const streamOfStreams = Stream(a)
    const latest = switchImmediate(streamOfStreams)
    t.equal(latest.get(), 1)

    t.end()
  })

  t.test('emits with the current value of the inner stream when streamOfStreams emits', t => {
    const a = Stream(1)
    const b = Stream(2)
    const streamOfStreams = Stream(a)
    const latest = switchImmediate(streamOfStreams)

    streamOfStreams.set(b)

    t.equal(latest.get(), 2)

    streamOfStreams.set(a)

    t.equal(latest.get(), 1)

    t.end()
  })

  t.test('emits with the current value of the inner stream when the inner stream emits', t => {
    const a = Stream('a')
    const b = Stream('b')
    const streamOfStreams = Stream(a)
    const latest = switchImmediate(streamOfStreams)
    streamOfStreams.set(b)

    t.equal(latest.get(), 'b')

    b.set('bb')

    t.equal(latest.get(), 'bb')

    streamOfStreams.set(a)

    t.equal(latest.get(), 'a')

    a.set('aa')

    t.equal(latest.get(), 'aa')

    streamOfStreams.set(b)

    t.equal(latest.get(), 'bb')

    t.end()
  })

  t.test('ends when streamOfStreams ends', t => {
    const a = Stream()
    const streamOfStreams = Stream(a)
    const c = switchImmediate(streamOfStreams)

    a.set(10)
    streamOfStreams.end()

    t.equal(c.get(), 10)
    t.true(c.end.get())

    a.set(20)

    t.equal(c.get(), 10)

    t.end()
  })

  t.test('does not end when inner stream ends', t => {
    const a = Stream()
    const b = Stream(1)
    const streamOfStreams = Stream(a)
    const c = switchImmediate(streamOfStreams)

    a.set(10)

    t.equal(c.get(), 10)

    a.end()

    t.false(c.end.get())

    streamOfStreams.set(b)

    t.equal(c.get(), 1)

    b.set(20)

    t.equal(c.get(), 20)

    t.end()
  })

})
